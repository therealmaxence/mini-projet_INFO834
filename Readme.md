# Compte-rendu d’avancement – Projet de messagerie instantanée

## 1. Informations générales

Sujet : Création d’un service de messagerie instantanée

Développeurs :
- Lucas BILLY
- Maxence AMBERT
- Louis AMOUDRUZ
- Corentin CAMPILLO-LAFIN

## 2. Contexte du projet

Ce projet s’inscrit dans le cadre du mini-projet INFO834, dont l’objectif est de développer une application de tchat permettant à des utilisateurs de communiquer en temps réel.

Les principales contraintes techniques sont :
- Utilisation de MongoDB pour le stockage des messages
- Utilisation de Redis pour les données en temps réel (ex : utilisateurs connectés)
- Mise en place d’un ReplicaSet MongoDB pour assurer la tolérance aux pannes
- Implémentation d’une interface permettant la communication entre utilisateurs

## 3. Architecture du projet

L’architecture mise en place repose sur une approche microservices conteneurisée via Docker :

- Orchestration : Docker
- Backend (API REST) :
  - Framework : NestJS
  - Authentification : JWT
  - Modules : Profiles, Channels, Messages
  - Base de données : MongoDB
- Communication temps réel :
  - WebSocket avec Socket.io
- Frontend :
  - Framework : Next.js
- Bases de données :
  - MongoDB :
    - ReplicaSet (Primary / Secondary)
    - Stockage global des données (messages, utilisateurs, salons)
  - Redis :
    - Gestion des statistiques en temps réel (ex : utilisateurs connectés)

## 4. Répartition des tâches
- Lucas BILLY :
  - Initialisation de l’environnement Docker
  - Développement de l’API
- Maxence AMBERT :
  - Développement frontend
- Corentin CAMPILLO-LAFIN :
  - Développement frontend
- Louis AMOUDRUZ :
  - Développement du module WebSocket
 
## 5. État d’avancement
### 5.1 Backend – API REST (≈ 95% terminé)

L’API est presque entièrement fonctionnelle :
- Toutes les routes principales sont implémentées et utilisables
- Gestion complète :
  - Authentification (JWT)
  - Création et gestion des salons (channels)
  - Envoi et stockage des messages (texte et fichiers)
  - Gestion de la visibilité (public / privé)
Amélioration en cours :
- Optimisation du format des réponses API (enrichissement des relations)
Exemple actuel :
```
{ 
  "_id": "d6s5fds4qsq5sq5", 
  "owner": "sq5d4qs1qcq4cw2", 
  "name": "channel1" 
}
```
Objectif :
```
{ 
  "_id": "d6s5fds4qsq5sq5", 
  "owner": { 
    "_id": "sq5d4qs1qcq4cw2", 
    "username": "profile1" 
  }, 
  "name": "channel1" 
}
```
### 5.2 Frontend (avancement visuel terminé)
- Pages réalisées :
  - Login
  - Register
  - Interface de messagerie
- L’interface utilisateur est finalisée sur le plan esthétique
Reste à faire :
- Connexion complète avec l’API
- Intégration avec les WebSockets pour le temps réel
### 5.3 WebSocket
- Mise en place initiale effectuée
- Fonctionnalités déjà présentes :
  - Connexion des utilisateurs
  - Authentification via token (JWT)
Reste à faire :
- Synchronisation complète avec le frontend
- Gestion en temps réel des messages (émission / réception)
- Intégration avec Redis pour les états en ligne

## 6. Points à finaliser
- Liaison Frontend ↔ API ↔ WebSocket
- Amélioration des réponses API (population des données MongoDB)
- Exploitation complète de Redis (utilisateurs connectés, statistiques)
- Tests globaux et validation fonctionnelle
