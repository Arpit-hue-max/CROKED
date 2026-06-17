import sys
import os
import logging

# Add the parent directory to Python path to import app correctly
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.angelone_client import angelone_client
from app.config import settings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_angelone_integration():
    print("--------------------------------------------------")
    print("Testing Angel One SmartAPI Integration...")
    print("--------------------------------------------------")
    
    # Check if configured
    if not angelone_client.is_configured():
        print("[WARNING] Angel One client is not fully configured.")
        print("Please check your environment variables in backend/.env:")
        print(f"API Key: {'Set' if settings.angelone_api_key else 'Missing'}")
        print(f"Client Code: {'Set' if settings.angelone_client_code else 'Missing'}")
        print(f"Password/PIN: {'Set' if settings.angelone_password else 'Missing'}")
        print(f"TOTP Secret: {'Set' if settings.angelone_totp_secret else 'Missing'}")
        print("The application will fallback to yfinance.")
        return
        
    print("[INFO] Settings found. Trying to connect and load instruments...")
    try:
        # Load instruments
        angelone_client.load_instruments()
        print(f"[SUCCESS] Loaded {len(angelone_client.token_map)} instruments.")
        
        # Test symbol resolution
        test_symbols = ["RELIANCE.NS", "SBIN.NS", "^NSEI"]
        print("\nResolving test symbols:")
        for sym in test_symbols:
            token, seg = angelone_client.resolve_token(sym)
            print(f"  {sym} -> Token: {token}, Segment: {seg}")
            if not token:
                print(f"  [ERROR] Failed to resolve {sym}")
                
        # Test quote retrieval
        print("\nFetching quotes:")
        quotes = angelone_client.get_quotes(test_symbols)
        if quotes:
            for sym, q in quotes.items():
                print(f"  {sym} -> Price: INR {q['price']}, Change: {q['change']}% (Volume: {q['volume']})")
            print("[SUCCESS] Market data retrieved successfully.")
        else:
            print("[ERROR] No quotes retrieved from Angel One API.")
            
    except Exception as e:
        print(f"[FATAL] Connection/Retrieval failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_angelone_integration()
