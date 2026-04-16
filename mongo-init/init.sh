#!/bin/bash
set -e

HOST="mongo-primary:27017"
DB="mini-project"
SEED_DIR="/seeds"
FLAG_COLLECTION="__seeded__"

echo "⏳ Attente que MongoDB soit disponible..."
until mongosh --host "$HOST" --eval "db.adminCommand('ping')" --quiet 2>/dev/null; do
  sleep 2
done
echo "✅ MongoDB disponible."

echo "⏳ Initialisation du replica set..."
mongosh --host "$HOST" --eval "
  try {
    rs.status();
    print('Replica set déjà initialisé.');
  } catch (e) {
    print('Initialisation du replica set...');
    rs.initiate({
      _id: 'rs0',
      members: [
        { _id: 0, host: 'mongo-primary:27017', priority: 2 },
        { _id: 1, host: 'mongo-secondary:27017', priority: 1 }
      ]
    });
  }
" 2>/dev/null || true

echo "⏳ Attente que le noeud devienne PRIMARY..."
until mongosh --host "$HOST" --quiet --eval \
  "db.hello().isWritablePrimary" | grep true >/dev/null 2>&1; do
  sleep 2
done
echo "✅ Le noeud est PRIMARY."

# Vérifie si les données ont déjà été insérées
ALREADY_SEEDED=$(mongosh --host "$HOST" "$DB" --quiet --eval \
  "db.getCollection('$FLAG_COLLECTION').countDocuments()" 2>/dev/null || echo "0")

if [ "$ALREADY_SEEDED" -gt "0" ]; then
  echo "⏭️  Données déjà présentes, import ignoré."
  exit 0
fi

echo "📥 Import des données par défaut..."

for file in $(ls "$SEED_DIR"/*.json | sort -V); do
  collection=$(basename "$file" .json | sed 's/^[0-9]*_//')
  echo "  → Import de $collection depuis $file"
  mongoimport \
    --host "$HOST" \
    --db "$DB" \
    --collection "$collection" \
    --file "$file" \
    --jsonArray
done

mongosh --host "$HOST" "$DB" --eval \
  "db.getCollection('$FLAG_COLLECTION').insertOne({ seededAt: new Date() })"

echo "✅ Seed terminé."