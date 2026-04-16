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
### 5.1 Backend – API REST (Terminé)

L’API est presque entièrement fonctionnelle :
- Toutes les routes principales sont implémentées et utilisables
- Gestion complète :
  - Authentification (JWT)
  - Création et gestion des salons (channels)
  - Envoi et stockage des messages (texte et fichiers)
  - Gestion de la visibilité (public / privé)
  
### 5.2 Frontend (Terminé)
- Pages réalisées :
  - Login
  - Register
  - Profile
  - Interface de messagerie
  - Interface des salons

### 5.3 WebSocket (Terminé)
- Connection des utilisateurs (JWT)
- Transfère des messages dans les salons
- Communication avec Redis sur les utilisateurs en temps réel

## 6. Axes d'amélioration
- Permettre d'envoyé des fichier via webapp
- Ajouter des plus statistiques sur Redis
