import os
import sys
import pickle
import face_recognition
from pymongo import MongoClient
from bson import ObjectId
import argparse

parser = argparse.ArgumentParser()
parser.add_argument('--source', required=True)
args = parser.parse_args()

source = args.source
print(f"Auto‑labeling for source: {source}")

# Paths
BASE = f"D:/instagramscraping/accounts/{source}"
PROFILE_PICS_DIR = f"{BASE}/downloaded_profiles"
CACHE_FILE = f"{BASE}/face_encodings_cache.pkl"

# MongoDB
client = MongoClient("mongodb://localhost:27017/")
db = client["peopleintel"]
clusters_col = db["faceclusters"]

# Get sourceId
source_doc = db["socialmediasources"].find_one({"username": source})
if not source_doc:
    print("Source not found")
    sys.exit(1)
source_id = source_doc["_id"]

# 1. Load or compute cluster encodings
def get_cluster_encoding(cluster):
    img_path = cluster.get("representativeImage")
    if not img_path or not os.path.exists(img_path):
        return None
    try:
        img = face_recognition.load_image_file(img_path)
        locs = face_recognition.face_locations(img)
        if not locs:
            return None
        return face_recognition.face_encodings(img, [locs[0]])[0]
    except:
        return None

cluster_encodings = {}
if os.path.exists(CACHE_FILE):
    with open(CACHE_FILE, 'rb') as f:
        cluster_encodings = pickle.load(f)
    print(f"Loaded {len(cluster_encodings)} cached encodings")
else:
    # Compute fresh
    clusters = list(clusters_col.find({"sourceId": source_id}))
    for c in clusters:
        enc = get_cluster_encoding(c)
        if enc is not None:
            cluster_encodings[str(c["_id"])] = enc
    with open(CACHE_FILE, 'wb') as f:
        pickle.dump(cluster_encodings, f)
    print(f"Computed and saved {len(cluster_encodings)} encodings")

# 2. Match each profile picture
profile_files = [f for f in os.listdir(PROFILE_PICS_DIR) if f.endswith('.jpg')]
print(f"Found {len(profile_files)} profile pictures")

matched = 0
for filename in profile_files:
    username = filename.rsplit('_', 1)[0]
    filepath = os.path.join(PROFILE_PICS_DIR, filename)
    try:
        img = face_recognition.load_image_file(filepath)
        locs = face_recognition.face_locations(img)
        if not locs:
            continue
        enc = face_recognition.face_encodings(img, [locs[0]])[0]
    except:
        continue

    best_cluster = None
    best_dist = 1.0
    for cid, c_enc in cluster_encodings.items():
        dist = face_recognition.face_distance([c_enc], enc)[0]
        if dist < best_dist:
            best_dist = dist
            best_cluster = cid

    if best_cluster and best_dist < 0.5:
        clusters_col.update_one(
            {"_id": ObjectId(best_cluster)},
            {"$set": {"label": username}}
        )
        matched += 1
        print(f"✅ {username} → cluster {best_cluster} (dist={best_dist:.3f})")

print(f"Auto‑labeled {matched} clusters")