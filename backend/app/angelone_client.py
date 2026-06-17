import os
import time
import json
import logging
import urllib.request
import threading
import pyotp
from SmartApi import SmartConnect
from app.config import settings

logger = logging.getLogger(__name__)

# Local path to cache the instrument list
SCRIP_MASTER_CACHE_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "angelone_scrip_master.json"
)

# Hardcoded indices tokens as per OpenAPI requirements
INDEX_TOKENS = {
    "^NSEI": {"token": "99926000", "exch_seg": "NSE", "symbol": "Nifty 50"},
    "^NSEBANK": {"token": "99926009", "exch_seg": "NSE", "symbol": "Nifty Bank"},
    "^BSESN": {"token": "99919000", "exch_seg": "BSE", "symbol": "SENSEX"},
}

class AngelOneClient:
    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(AngelOneClient, cls).__new__(cls)
                cls._instance._initialized = False
            return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self.api_key = settings.angelone_api_key
        self.client_code = settings.angelone_client_code
        self.password = settings.angelone_password
        self.totp_secret = settings.angelone_totp_secret

        self.smart_connect = None
        self.jwt_token = None
        self.token_map = {}  # Map (clean_symbol, exch_seg) -> token
        self.symbol_to_name = {} # Map symbol -> company name
        self.token_to_symbol = {} # Map token -> (symbol, exch_seg)
        self.connection_lock = threading.Lock()
        self.last_login_time = 0
        self.session_validity_seconds = 18 * 3600  # Sessions are usually valid for 24 hours, refresh after 18 hours

        # Trigger background loading of instruments
        self._instrument_loaded = False
        self._initialized = True

    def is_configured(self) -> bool:
        return bool(self.api_key and self.client_code and self.password and self.totp_secret)

    def _ensure_connection(self) -> bool:
        if not self.is_configured():
            return False

        now = time.time()
        # If already connected and session is valid, skip login
        if self.smart_connect and self.jwt_token and (now - self.last_login_time < self.session_validity_seconds):
            return True

        with self.connection_lock:
            # Double check in lock
            if self.smart_connect and self.jwt_token and (now - self.last_login_time < self.session_validity_seconds):
                return True

            try:
                logger.info("Initializing Angel One SmartConnect session...")
                self.smart_connect = SmartConnect(api_key=self.api_key)
                
                # Generate TOTP
                totp = pyotp.TOTP(self.totp_secret).now()
                
                # Log in
                login_data = self.smart_connect.generateSession(self.client_code, self.password, totp)
                
                if login_data.get("status") and login_data.get("data"):
                    self.jwt_token = login_data["data"]["jwtToken"]
                    self.last_login_time = time.time()
                    logger.info("Angel One SmartAPI session successfully established.")
                    return True
                else:
                    logger.error("Failed to generate Angel One session: %s", login_data)
                    self.smart_connect = None
                    self.jwt_token = None
                    return False
            except Exception as e:
                logger.exception("Exception during Angel One login: %s", e)
                self.smart_connect = None
                self.jwt_token = None
                return False

    def load_instruments(self):
        """Loads scrip master, downloading if cache is old or missing."""
        if self._instrument_loaded:
            return

        with self._lock:
            if self._instrument_loaded:
                return

            try:
                # Check cache first
                cache_valid = False
                if os.path.exists(SCRIP_MASTER_CACHE_PATH):
                    mtime = os.path.getmtime(SCRIP_MASTER_CACHE_PATH)
                    # Cache valid for 24 hours
                    if time.time() - mtime < 86400:
                        cache_valid = True

                if cache_valid:
                    logger.info("Loading instruments from local cache...")
                    try:
                        with open(SCRIP_MASTER_CACHE_PATH, "r", encoding="utf-8") as f:
                            instruments = json.load(f)
                            self._build_token_map(instruments)
                            self._instrument_loaded = True
                            return
                    except Exception as cache_err:
                        logger.warning("Failed to load cached instruments, redownloading: %s", cache_err)

                # Fetch fresh
                logger.info("Downloading fresh instrument master from Angel One...")
                urls = [
                    "https://margincalculator.angelone.in/OpenAPI_File/files/OpenAPIScripMaster.json",
                    "https://margincalculator.angelbroking.com/OpenAPI_File/files/OpenAPIScripMaster.json"
                ]
                
                data = None
                for url in urls:
                    try:
                        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
                        with urllib.request.urlopen(req, timeout=15) as response:
                            data = response.read()
                            if data:
                                break
                    except Exception as u_err:
                        logger.warning("Failed to fetch from %s: %s", url, u_err)

                if not data:
                    # Fallback to local expired cache if download failed
                    if os.path.exists(SCRIP_MASTER_CACHE_PATH):
                        logger.warning("Download failed. Falling back to expired local cache.")
                        with open(SCRIP_MASTER_CACHE_PATH, "r", encoding="utf-8") as f:
                            instruments = json.load(f)
                            self._build_token_map(instruments)
                            self._instrument_loaded = True
                            return
                    raise ValueError("Could not download instrument scrip master from any source.")

                # Parse and save cache
                instruments = json.loads(data)
                self._build_token_map(instruments)
                
                # Write to cache file in background or safely
                try:
                    with open(SCRIP_MASTER_CACHE_PATH, "w", encoding="utf-8") as f:
                        json.dump(instruments, f)
                except Exception as write_err:
                    logger.warning("Could not cache instruments to file: %s", write_err)

                self._instrument_loaded = True
                logger.info("Angel One instrument master loaded successfully.")
            except Exception as e:
                logger.exception("Error loading Angel One instruments: %s", e)

    def _build_token_map(self, instruments: list):
        self.token_map = {}
        self.symbol_to_name = {}
        self.token_to_symbol = {}
        
        # Parse equity and index instruments
        for inst in instruments:
            # We care about NSE and BSE equities and indices
            seg = inst.get("exch_seg")
            if seg not in ("NSE", "BSE"):
                continue

            symbol = inst.get("symbol", "")
            token = inst.get("token", "")
            name = inst.get("name", "")

            # E.g. RELIANCE-EQ on NSE
            if symbol.endswith("-EQ") or symbol.endswith("-GROUP") or seg == "NSE":
                clean_symbol = symbol.split("-")[0].upper()
                self.token_map[(clean_symbol, seg)] = token
                self.symbol_to_name[clean_symbol] = name
                self.token_to_symbol[token] = (clean_symbol, seg)

        # Apply hardcoded indices
        for idx_sym, val in INDEX_TOKENS.items():
            token = val["token"]
            seg = val["exch_seg"]
            self.token_map[(idx_sym, seg)] = token
            self.symbol_to_name[idx_sym] = val["symbol"]
            self.token_to_symbol[token] = (idx_sym, seg)

    def resolve_token(self, symbol: str) -> tuple[str, str]:
        """
        Resolves a symbol like RELIANCE.NS, RELIANCE.BO, ^NSEI to (token, exch_seg).
        Returns (None, None) if not found.
        """
        # Ensure instruments are loaded
        if not self._instrument_loaded:
            self.load_instruments()

        symbol = symbol.upper().strip()
        
        # 1. Check index hardcoding
        if symbol in INDEX_TOKENS:
            return INDEX_TOKENS[symbol]["token"], INDEX_TOKENS[symbol]["exch_seg"]

        # 2. Extract base symbol and segment
        if symbol.endswith(".NS"):
            base_symbol = symbol[:-3]
            seg = "NSE"
        elif symbol.endswith(".BO"):
            base_symbol = symbol[:-3]
            seg = "BSE"
        else:
            base_symbol = symbol
            seg = "NSE"  # Default

        # 3. Look up token map
        token = self.token_map.get((base_symbol, seg))
        if token:
            return token, seg

        # 4. Fallback search by matching base symbol
        # Sometimes symbols have minor spelling differences
        for (b_sym, s_seg), t_token in self.token_map.items():
            if b_sym == base_symbol and s_seg == seg:
                return t_token, s_seg

        return None, None

    def get_quotes(self, symbols: list[str]) -> dict[str, dict]:
        """
        Fetches full market quotes for a list of symbols from Angel One.
        Returns a dictionary of normalized quotes, or empty dict on failure/unconfigured.
        """
        if not self.is_configured():
            return {}

        if not self._ensure_connection():
            return {}

        # Resolve all symbols to tokens
        resolved_tokens = {}  # exch_seg -> list of tokens
        token_to_input_symbol = {}  # token -> original_input_symbol
        
        for sym in symbols:
            token, seg = self.resolve_token(sym)
            if token and seg:
                resolved_tokens.setdefault(seg, []).append(token)
                token_to_input_symbol[token] = sym

        if not resolved_tokens:
            return {}

        results = {}
        # Angel One allows fetching multiple tokens per segment
        for seg, tokens in resolved_tokens.items():
            try:
                # smartApi.getMarketData expects mode='FULL' or 'LTP'
                # and exchangeTokens = {'NSE': ['token1', 'token2']}
                response = self.smart_connect.getMarketData(
                    mode="FULL",
                    exchangeTokens={seg: tokens}
                )
                
                if response.get("status") and response.get("data") and "fetched" in response["data"]:
                    fetched_items = response["data"]["fetched"]
                    for item in fetched_items:
                        token = item.get("symboltoken")
                        orig_sym = token_to_input_symbol.get(token)
                        if not orig_sym:
                            continue
                        
                        price = float(item.get("ltp", 0.0))
                        close = float(item.get("close", 0.0))
                        
                        # Calculate change and percentChange if strings
                        net_chg = item.get("netChange", 0.0)
                        if isinstance(net_chg, str):
                            try:
                                net_chg = float(net_chg) if net_chg.strip() else 0.0
                            except ValueError:
                                net_chg = 0.0
                        
                        pct_chg = item.get("percentChange", 0.0)
                        if isinstance(pct_chg, str):
                            try:
                                pct_chg = float(pct_chg) if pct_chg.strip() else 0.0
                            except ValueError:
                                pct_chg = 0.0
                        
                        # Fallback calculation if change values are zero but price differs from close
                        if net_chg == 0.0 and price > 0.0 and close > 0.0:
                            net_chg = price - close
                            pct_chg = (net_chg / close) * 100.0

                        from datetime import datetime, timezone
                        results[orig_sym] = {
                            "price": price,
                            "change": round(net_chg, 2),
                            "change_percent": round(pct_chg, 2),
                            "volume": int(item.get("vol", 0)),
                            "as_of": datetime.now(timezone.utc).isoformat(),
                        }
            except Exception as e:
                logger.error("Error fetching quotes from Angel One for segment %s: %s", seg, e)

        return results

# Singleton instance
angelone_client = AngelOneClient()
