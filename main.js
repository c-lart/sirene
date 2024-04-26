const fs = require('fs');
const readline = require('readline');
const path = require('path');
const db = require('./db.js');
const pm2 = require('pm2');
const os = require('os');
const performance = require('perf_hooks')



const beginning = performance.performance.now();
const NODES = 1;
const inputFilePath = './StockEtablissement_utf8.csv'; 
const outputDirectory = './data';
const fileSizeLimit = 1024 * 1024 * 20; 

var WAITING_FILES = [];
var FREE_WORKERS = [];
var CURRENT_FILE = {};
var FILTER = [];


pm2.connect(async function (error) {
    if (error) {
        console.error('Erreur lors de la connexion à PM2:', error);
        process.exit(1);
    }

    pm2.launchBus(function (err, pm2_bus) {
        pm2_bus.on('process:msg', function (data) {
            console.log(data);
            update(data);
        })
    });

    try {
        if (fs.existsSync(inputFilePath)) {
            await db.connectDb(true);
            for (let i = 0; i < NODES; ++i) {
                pm2.start({
                    script: 'worker.js',
                    name: `worker${i}`,
                    instances: "max",
                    out_file: "./logs/workerlog.log",
                    error_file: "./logs/error.log"
                }, (err, _) => {
                    if (err) console.error(err);
                });
            }
            splitCSV(inputFilePath, outputDirectory, fileSizeLimit);

        }
    } catch (err) {
        console.error(err);
    }


});


function update(dataReceived = null) {

    if (dataReceived !== null) {
        if (dataReceived.data.READY) {
            console.log("Ce worker est prêt : " + dataReceived.data.PID);
            FREE_WORKERS.push(dataReceived.data.PID);
        } else {
            FREE_WORKERS.push(dataReceived.data.PID);
            console.log("le fichier  " + dataReceived.data.FILE + " a pris  " + (performance.performance.now() - CURRENT_FILE[dataReceived.data.FILE]) + " ms");
            if (FREE_WORKERS.length == os.cpus().length * NODES) {
                console.log("les données ont bien été entrées dans la base");
                console.log("l'indexation a pris : " + (performance.performance.now() - beginning) / 60000 + " minutes");
                pm2.delete('all')
                console.log("les process en cours ont été supprimés")
            }
        }
    }

    if (FILTER.length > 0 && WAITING_FILES.length > 0 && FREE_WORKERS.length > 0) {
        let count = Math.min(WAITING_FILES.length, FREE_WORKERS.length);
        for (let i = 0; i < count; ++i) {
            var worker = FREE_WORKERS[i];
            FREE_WORKERS.splice(i, 1);
            i--;
            count--;

            var todo = WAITING_FILES.shift();

            CURRENT_FILE[todo] = performance.performance.now();
            console.log("fichier " + todo + " envoyé au worker " + worker);
            pm2.sendDataToProcessId(worker, {
                type: 'process:msg',
                data: {
                    FILE: todo,
                },
                topic: "SIRENE-INVADER V2"
            }, (error, result) => {
                if (error) console.error(error);
            });

            i++;
        }
    }
}




// Fonction pour diviser un fichier CSV en plusieurs fichiers de taille égale
async function splitCSV(inputFilePath, outputDirectory, fileSizeLimit) {
    // Créer le dossier de sortie s'il n'existe pas
    if (!fs.existsSync(outputDirectory)) {
        fs.mkdirSync(outputDirectory);
    }
    const chunkBuffer = Buffer.alloc(fileSizeLimit);

    let bytesRead = 0;
    let offset = 0;
    let fileId = 0;

    const fp = fs.openSync(inputFilePath, 'r');

    while (bytesRead = fs.readSync(fp, chunkBuffer, 0, fileSizeLimit, offset)) {


        let streamEnd = LastChar("\n", chunkBuffer, bytesRead);
        let streamStart = 0;

        if (streamEnd < 0) {
            throw "erreur";
        } else {
            offset += streamEnd + 1;
        }

        if (FILTER.length == 0) {
            streamStart = FirstChar("\n", chunkBuffer, bytesRead);


            let tab = [];

            let lignes = chunkBuffer.slice(0, streamStart++).toString().split("\n");

            for (let i = 0; i < lignes.length; ++i) {


                tab.push(lignes[i].split(','));


            }



            let res = [];

            if (tab.length != 1) throw "Header doesn't exist.";

            let table_header = tab[0];

            const headers = [
                "siren",
                "nic",
                "siret",
                "dateCreationEtablissement",
                "dateDernierTraitementEtablissement",
                "typeVoieEtablissement",
                "libelleVoieEtablissement",
                "codePostalEtablissement",
                "libelleCommuneEtablissement",
                "codeCommuneEtablissement",
                "dateDebut",
                "etatAdministratifEtablissement"
            ];

            for (let i = 0; i < headers.length; ++i) {
                let idx = table_header.find(element => element.indexOf(headers[i]) > -1)
                if (idx === undefined) throw "Header not found: " + headers[i];
                res.push(idx);
            }

            FILTER = res;


        }

        await fs.writeFileSync(`./data/csv_part${fileId}.csv`, chunkBuffer.slice(streamStart, streamEnd));
        WAITING_FILES.push(`./data/csv_part${fileId}.csv`);
        fileId++;
        update();

    }

    console.log("division terminée");
}



function FirstChar(char, buffer, bufferSize) {
    for (let i = 0; i < bufferSize; ++i) {
        if (String.fromCharCode(buffer[i]) === char) {
            return i;
        }
    }
    return -1;
}

function LastChar(char, buffer, bufferSize) {
    for (let i = bufferSize - 1; i >= 0; --i) {
        if (String.fromCharCode(buffer[i]) === char) {
            return i;
        }
    }
    return -1;
}