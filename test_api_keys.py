import urllib.request
import json
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

print("Testing SERP API...")
try:
    req = urllib.request.Request("https://serpapi.com/search.json?q=test&api_key=c55b79c0004d85d64d73b53145f4e0d876eac56c1604cae458d531f47fd6b541")
    res = urllib.request.urlopen(req, context=ctx)
    data = json.loads(res.read())
    if "organic_results" in data or "search_metadata" in data:
        print("SERP API: Working")
    else:
        print("SERP API Response unexpected")
except Exception as e:
    print("SERP API Error:", str(e))

print("Testing GROQ API...")
try:
    req = urllib.request.Request("https://api.groq.com/openai/v1/chat/completions", method="POST")
    req.add_header("Authorization", "Bearer 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")
    req.add_header("Content-Type", "application/json")
    req.add_header("User-Agent", "Mozilla/5.0")
    body = json.dumps({"model": "llama-3.1-8b-instant", "messages": [{"role": "user", "content": "hi"}], "max_tokens": 5}).encode("utf-8")
    res = urllib.request.urlopen(req, data=body, context=ctx)
    data = json.loads(res.read())
    if "choices" in data:
        print("GROQ API: Working")
    else:
        print("GROQ API Response unexpected")
except urllib.error.HTTPError as e:
    print("GROQ API Error (HTTP):", e.code, e.read().decode("utf-8"))
except Exception as e:
    print("GROQ API Error:", str(e))
