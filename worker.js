const fs = require('fs');
const mongoose = require('mongoose');
const db = require("./db.js");


const Schema = mongoose.Schema;
const etablissementSchema = new Schema({
    siren: String,
    nic: String,
    siret: String,
    dateCreationEtablissement: Date,
    dateDernierTraitementEtablissement: Date,
    typeVoieEtablissement: String,
    libelleVoieEtablissement: String,
    codePostalEtablissement: String,
    libelleCommuneEtablissement: String,
    codeCommuneEtablissement: String,
    dateDebut: Date,
    etatAdministratifEtablissement: String
});
const Etablissement = mongoose.model('Etablissement', etablissementSchema);

process.send({
    type: 'process:msg',
    data: {
        READY: true,
        PID: process.env.pm_id
    }
});


// Traitement des fichiers CSV
process.on('message', async function (dataReceived)  {
    try {
        await db.connectDb();
        var CurrentfilePath = dataReceived.data.FILE;
        var fileContent = fs.readFileSync(CurrentfilePath);
        var objects = fileContent.toString().split("\n").map((line) => {
            const data = line.split(",");
            const objet = {
                _id: new mongoose.Types.ObjectId().toString(),
                siren: data[0].replace(/['"]+/g, '') || undefined, //
                nic: data[1].replace(/['"]+/g, '') || undefined, //
                siret: data[2].replace(/['"]+/g, '') || undefined, //
                dateCreationEtablissement: data[4].replace(/['"]+/g, '') || undefined, //
                dateDernierTraitementEtablissement: data[8].replace(/['"]+/g, '') || undefined,
                typeVoieEtablissement: data[14].replace(/['"]+/g, '') || undefined,
                libelleVoieEtablissement: data[15].replace(/['"]+/g, '') || undefined,
                codePostalEtablissement: data[16].replace(/['"]+/g, '') || undefined,
                libelleCommuneEtablissement: data[17].replace(/['"]+/g, '') || undefined,
                codeCommuneEtablissement: data[20].replace(/['"]+/g, '') || undefined,
                dateDebut: data[39].replace(/['"]+/g, '') || undefined,
                etatAdministratifEtablissement: data[40].replace(/['"]+/g, '') || undefined
            };
            return Object.fromEntries(Object.entries(objet).filter(([, value]) => value !== undefined));
        });  

        if(objects != null){
            var dataInserted = await Etablissement.collection.insertMany(objects);
            console.log(dataInserted.insertedCount + " objets insérés dans la db");
            await db.disconnectDb();
        }
    } catch (error) {
        console.error(`Erreur lors du traitement du fichier ${CurrentfilePath}:`, error);
        process.send({ CurrentfilePath, status: 'error' });
    }

    process.send({
        type: 'process:msg',
        data: {
            FILE: CurrentfilePath,
            PID: process.env.pm_id
        }
    });
});

