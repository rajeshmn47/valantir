const FaceCluster = require("../models/FaceCluster");
const Profile = require("../models/Profile");
const connectDB = require("./connect");
const XLSX = require('xlsx');
const fs = require('fs');

async function findusers() {
    let fmap = {};
    await connectDB();
    const excelPath = `D:/instagramscraping/accounts/mj_ave/followers.xlsx`;
    if (!fs.existsSync(excelPath)) return [];

    const workbook = XLSX.readFile(excelPath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    // Assuming column index 2 (third column) contains usernames – adjust if different
    const usernames = rows.slice(1).map(row => row[6]).filter(v => v && v !== 'nan').map(v => String(v));
    //console.log(usernames.filter((f) => !isNaN(f)), "usernames");
    //console.log(socialmedialinks, "profiles");
    let nums = []
    for (let u of usernames) {
        let l = u[0];
        const digits = u.replace(/\D/g, ""); // Result: "234"
        if (digits.length > 0) {
            nums.push([digits,u])
        }
    }
    console.log(nums, "fmap");
    //console.log(entries, "sorting");
    process.exit();
}

findusers()
console.log(parseInt("1raju12"), "parsetest")