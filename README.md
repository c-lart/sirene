# sirene

# Projet de Traitement de Fichiers CSV

Ce projet vise à traiter de gros fichiers CSV en les divisant en fichiers plus petits et en les insérant dans une base de données MongoDB à l'aide de workers.

## Prérequis

- Node.js installé sur votre système
- MongoDB installé et en cours d'exécution sur votre machine avec une bdd nommée "sirene"

## Installation

1. Clonez ce dépôt sur votre machine 
2. Installez les dépendances en exécutant la commande suivante à la racine du projet :
    -npm install

## Utilisation

1. Placez votre fichier CSV à traiter à la racine avec le nom `StockEtablissement_utf8.csv`.
2. Lancez l'application en exécutant la commande `npm start` 
3. Les fichiers split vont être save dans le répertoire `data` et automatiqueent parcourus pour enregistrer en base


## Architecture du Projet

- `main.js`: Le point d'entrée de l'application qui coordonne le traitement des fichiers CSV.
- `worker.js`: Le worker chargé de traiter les fichiers CSV et d'insérer les données dans la base de données.
- `db.js`: Module gérant la connexion à la base de données MongoDB.

## Configuration

- `NODES`: Le nombre de workers à lancer pour traiter les fichiers CSV. Actuellement défini sur 1.
- `inputFilePath`: Le chemin du fichier CSV à traiter.
- `outputDirectory`: Le répertoire où les fichiers CSV divisés seront stockés.
- `fileSizeLimit`: La taille maximale des fichiers CSV divisés, actuellement définie sur 20 Mo.


Topographie :

![alt text](https://github.com/c-lart/sirene/blob/main/topographie.png)

UML : 

![alt text](https://github.com/c-lart/sirene/blob/main/UML.drawio.png)
