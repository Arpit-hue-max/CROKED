"""Curated Indian stock universe for NSE (primary) and BSE."""

INDIAN_STOCKS: list[dict[str, str]] = [
    {"symbol": "RELIANCE.NS", "name": "Reliance Industries", "exchange": "NSE", "sector": "Energy"},
    {"symbol": "TCS.NS", "name": "Tata Consultancy Services", "exchange": "NSE", "sector": "IT"},
    {"symbol": "HDFCBANK.NS", "name": "HDFC Bank", "exchange": "NSE", "sector": "Banking"},
    {"symbol": "INFY.NS", "name": "Infosys", "exchange": "NSE", "sector": "IT"},
    {"symbol": "ICICIBANK.NS", "name": "ICICI Bank", "exchange": "NSE", "sector": "Banking"},
    {"symbol": "HINDUNILVR.NS", "name": "Hindustan Unilever", "exchange": "NSE", "sector": "FMCG"},
    {"symbol": "ITC.NS", "name": "ITC Limited", "exchange": "NSE", "sector": "FMCG"},
    {"symbol": "SBIN.NS", "name": "State Bank of India", "exchange": "NSE", "sector": "Banking"},
    {"symbol": "BHARTIARTL.NS", "name": "Bharti Airtel", "exchange": "NSE", "sector": "Telecom"},
    {"symbol": "KOTAKBANK.NS", "name": "Kotak Mahindra Bank", "exchange": "NSE", "sector": "Banking"},
    {"symbol": "LT.NS", "name": "Larsen & Toubro", "exchange": "NSE", "sector": "Infrastructure"},
    {"symbol": "AXISBANK.NS", "name": "Axis Bank", "exchange": "NSE", "sector": "Banking"},
    {"symbol": "BAJFINANCE.NS", "name": "Bajaj Finance", "exchange": "NSE", "sector": "NBFC"},
    {"symbol": "ASIANPAINT.NS", "name": "Asian Paints", "exchange": "NSE", "sector": "Consumer"},
    {"symbol": "MARUTI.NS", "name": "Maruti Suzuki", "exchange": "NSE", "sector": "Auto"},
    {"symbol": "TITAN.NS", "name": "Titan Company", "exchange": "NSE", "sector": "Consumer"},
    {"symbol": "SUNPHARMA.NS", "name": "Sun Pharmaceutical", "exchange": "NSE", "sector": "Pharma"},
    {"symbol": "WIPRO.NS", "name": "Wipro", "exchange": "NSE", "sector": "IT"},
    {"symbol": "ULTRACEMCO.NS", "name": "UltraTech Cement", "exchange": "NSE", "sector": "Cement"},
    {"symbol": "NESTLEIND.NS", "name": "Nestle India", "exchange": "NSE", "sector": "FMCG"},
    {"symbol": "POWERGRID.NS", "name": "Power Grid Corporation", "exchange": "NSE", "sector": "Utilities"},
    {"symbol": "NTPC.NS", "name": "NTPC Limited", "exchange": "NSE", "sector": "Utilities"},
    {"symbol": "TMCV.NS", "name": "Tata Motors (Commercial)", "exchange": "NSE", "sector": "Auto"},
    {"symbol": "TMPV.NS", "name": "Tata Motors (Passenger)", "exchange": "NSE", "sector": "Auto"},
    {"symbol": "ADANIENT.NS", "name": "Adani Enterprises", "exchange": "NSE", "sector": "Conglomerate"},
    {"symbol": "HCLTECH.NS", "name": "HCL Technologies", "exchange": "NSE", "sector": "IT"},
    {"symbol": "TECHM.NS", "name": "Tech Mahindra", "exchange": "NSE", "sector": "IT"},
    {"symbol": "M&M.NS", "name": "Mahindra & Mahindra", "exchange": "NSE", "sector": "Auto"},
    {"symbol": "BAJAJFINSV.NS", "name": "Bajaj Finserv", "exchange": "NSE", "sector": "NBFC"},
    {"symbol": "JSWSTEEL.NS", "name": "JSW Steel", "exchange": "NSE", "sector": "Metals"},
    {"symbol": "ETERNAL.NS", "name": "Eternal Ltd (formerly Zomato)", "exchange": "NSE", "sector": "Consumer"},
    {"symbol": "JIOFIN.NS", "name": "Jio Financial Services", "exchange": "NSE", "sector": "Banking"},
    {"symbol": "NYKAA.NS", "name": "FSN E-Commerce (Nykaa)", "exchange": "NSE", "sector": "Consumer"},
    {"symbol": "IREDA.NS", "name": "Indian Renewable Energy Agency", "exchange": "NSE", "sector": "NBFC"},
    {"symbol": "HUDCO.NS", "name": "Housing & Urban Dev Corp", "exchange": "NSE", "sector": "NBFC"},
    {"symbol": "GC=F", "name": "Gold Futures (COMEX)", "exchange": "COMEX", "sector": "Commodity"},
    {"symbol": "CL=F", "name": "Crude Oil Futures (NYMEX)", "exchange": "NYMEX", "sector": "Commodity"},
    {"symbol": "SI=F", "name": "Silver Futures (COMEX)", "exchange": "COMEX", "sector": "Commodity"},
    {"symbol": "NG=F", "name": "Natural Gas Futures", "exchange": "NYMEX", "sector": "Commodity"},
    {"symbol": "HG=F", "name": "Copper Futures (COMEX)", "exchange": "COMEX", "sector": "Commodity"},
    {"symbol": "GOLDBEES.NS", "name": "Nippon India Gold BeES ETF", "exchange": "NSE", "sector": "Commodity"},
    {"symbol": "SILVERBEES.NS", "name": "Nippon India Silver BeES ETF", "exchange": "NSE", "sector": "Commodity"},
    {"symbol": "^NSEI", "name": "NIFTY 50 Index (F&O Active)", "exchange": "NSE", "sector": "F&O Index"},
    {"symbol": "^BSESN", "name": "SENSEX Index", "exchange": "BSE", "sector": "Index"},
    {"symbol": "^NSEBANK", "name": "NIFTY Bank Index (F&O Active)", "exchange": "NSE", "sector": "F&O Index"},
]

VALID_SUFFIXES = {".NS", ".BO"}
VALID_INDEX_PREFIX = "^"


def normalize_symbol(raw: str) -> str:
    """Normalize user input to a valid Yahoo Finance Indian ticker."""
    symbol = raw.strip().upper()
    if not symbol:
        raise ValueError("Symbol cannot be empty")

    # Handle rebranded, merged, F&O, and commodity Indian stocks
    redirects = {
        "ZOMATO": "ETERNAL.NS",
        "ZOMATO.NS": "ETERNAL.NS",
        "ZOMATO.BO": "ETERNAL.BO",
        "MINDTREE": "LTIM.NS",
        "MINDTREE.NS": "LTIM.NS",
        "MINDTREE.BO": "LTIM.BO",
        "ADANITRANS": "ADANIENSOL.NS",
        "ADANITRANS.NS": "ADANIENSOL.NS",
        "ADANITRANS.BO": "ADANIENSOL.BO",
        # F&O and Commodity redirects
        "GOLD": "GC=F",
        "GOLD.F": "GC=F",
        "CRUDE": "CL=F",
        "CRUDEOIL": "CL=F",
        "CRUDEOIL.F": "CL=F",
        "SILVER": "SI=F",
        "SILVER.F": "SI=F",
        "NATURALGAS": "NG=F",
        "NATURALGAS.F": "NG=F",
        "COPPER": "HG=F",
        "COPPER.F": "HG=F",
        "NIFTYFUT": "^NSEI",
        "BANKNIFTYFUT": "^NSEBANK",
    }
    if symbol in redirects:
        return redirects[symbol]

    if symbol.startswith(VALID_INDEX_PREFIX) or symbol.endswith("=F"):
        return symbol

    if "." not in symbol:
        symbol = f"{symbol}.NS"

    suffix = "." + symbol.split(".")[-1]
    if suffix not in VALID_SUFFIXES:
        raise ValueError("Only NSE (.NS) and BSE (.BO) symbols are supported")

    base = symbol.rsplit(".", 1)[0]
    if not base.replace("-", "").isalnum():
        raise ValueError("Invalid symbol format")

    return symbol


_SEARCH_CACHE: dict[str, list[dict[str, str]]] = {}

def search_stocks(query: str, limit: int = 12) -> list[dict[str, str]]:
    q = query.strip().upper()
    if not q:
        return INDIAN_STOCKS[:limit]

    # Check search cache first for instant results
    if q in _SEARCH_CACHE:
        return _SEARCH_CACHE[q][:limit]

    # Stagger and filter results to ensure they are unique by symbol
    seen_symbols = set()
    results = []

    def add_result(stock: dict[str, str]):
        sym = stock["symbol"].upper()
        if sym not in seen_symbols:
            seen_symbols.add(sym)
            results.append(stock)

    # 1. Search local curated stocks first (fast matching)
    for stock in INDIAN_STOCKS:
        if (
            q in stock["symbol"]
            or q in stock["name"].upper()
            or q.replace(".NS", "").replace(".BO", "") in stock["symbol"]
        ):
            add_result(stock)

    # 2. Check curated redirects list to handle legacy rebranded names (like ZOMATO -> ETERNAL.NS)
    redirects = {
        "ZOMATO": "ETERNAL.NS",
        "ZOMATO.NS": "ETERNAL.NS",
        "ZOMATO.BO": "ETERNAL.BO",
        "MINDTREE": "LTIM.NS",
        "MINDTREE.NS": "LTIM.NS",
        "MINDTREE.BO": "LTIM.BO",
        "ADANITRANS": "ADANIENSOL.NS",
        "ADANITRANS.NS": "ADANIENSOL.NS",
        "ADANITRANS.BO": "ADANIENSOL.BO",
    }
    for key, target in redirects.items():
        if q in key:
            target_stock = next((s for s in INDIAN_STOCKS if s["symbol"].upper() == target.upper()), None)
            if target_stock:
                add_result(target_stock)
            else:
                add_result({
                    "symbol": target,
                    "name": f"{key} (Rebranded to {target})",
                    "exchange": "NSE" if target.endswith(".NS") else "BSE",
                    "sector": "Indian Equities"
                })

    # 3. Dynamic online search query to Yahoo Finance
    # This allows users to find ANY SEBI-registered Indian stock, ETF, index, or IPO
    # Only perform slow network request if query length is >= 3 characters
    # Skip online query if we already have an exact local match on the symbol prefix (e.g., "TCS" matches "TCS.NS")
    has_exact_local_match = any(
        q == s["symbol"].upper() or q == s["symbol"].split(".")[0].upper()
        for s in results
    )
    if len(q) >= 3 and not has_exact_local_match:
        try:
            import yfinance as yf
            # yfinance Search handles user-agents, crumbs, and request sessions robustly
            search_results = yf.Search(q, max_results=15)
            for item in search_results.quotes:
                symbol = item.get("symbol", "").upper()
                # We only want Indian listed stocks/ETFs (.NS, .BO), futures (*=F), or active index markers (^*)
                is_indian = (
                    symbol.endswith(".NS") or 
                    symbol.endswith(".BO") or 
                    symbol.startswith("^") or 
                    symbol.endswith("=F")
                )
                if not is_indian:
                    continue

                exchange = "NSE" if symbol.endswith(".NS") else ("BSE" if symbol.endswith(".BO") else "Other")
                if symbol.startswith("^"):
                    exchange = "INDEX"
                elif symbol.endswith("=F"):
                    exchange = "FUTURE"

                name = item.get("shortname") or item.get("longname") or symbol
                sector = item.get("sector") or item.get("industry") or "Indian Securities"

                add_result({
                    "symbol": symbol,
                    "name": name,
                    "exchange": exchange,
                    "sector": sector
                })
        except Exception as e:
            import logging
            logging.getLogger(__name__).warning("Online Yahoo stock search failed: %s", e)

    # 4. Fallback: Dynamic suggestion for custom ticker if it maps standard rules
    clean_q = q.replace(".NS", "").replace(".BO", "").replace("^", "").strip()
    if clean_q and clean_q.replace("-", "").isalnum() and len(clean_q) <= 12:
        add_result({
            "symbol": f"{clean_q}.NS",
            "name": f"Analyze Custom Equity: {clean_q}",
            "exchange": "NSE",
            "sector": "Indian Equities"
        })
        add_result({
            "symbol": f"{clean_q}.BO",
            "name": f"Analyze Custom Equity: {clean_q} (BSE)",
            "exchange": "BSE",
            "sector": "Indian Equities"
        })

    # Cache the result list for future instant lookups
    _SEARCH_CACHE[q] = results
    return results[:limit]
