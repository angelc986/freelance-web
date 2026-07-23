import requests

BASE = "http://127.0.0.1:8000/api/v1"

print("--- User #10 ratings ---")
r = requests.get(BASE + "/users/10/ratings")
d = r.json()
print("  avg:", d["avg"], "- total:", d["total"])
print("  breakdown:", d["breakdown"])
for rev in d["reviews"]:
    c = rev["comment"] or ""
    print("  -", rev["rater_name"], ":", rev["rating"], "stars -", c[:50])

print()
print("--- User #7 ratings ---")
r = requests.get(BASE + "/users/7/ratings")
d = r.json()
print("  avg:", d["avg"], "- total:", d["total"])
print("  breakdown:", d["breakdown"])
for rev in d["reviews"]:
    c = rev["comment"] or ""
    print("  -", rev["rater_name"], ":", rev["rating"], "stars -", c[:50])

print()
print("--- Public profile #10 (no wallet) ---")
r = requests.get(BASE + "/users/10")
d = r.json()
for k, v in d.items():
    print(" ", k + ":", v)
print("  wallet_address present:", "wallet_address" in d)

print()
print("--- Jobs list ---")
r = requests.get(BASE + "/jobs/?status=open")
print("  Open jobs:", len(r.json()))
j = r.json()
if j:
    print("  Latest:", j[0]["title"], "- $" + str(j[0]["budget"]))

print()
print("ALL OK")
