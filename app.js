const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("mysql2");

const app = express();
const PORT = process.env.PORT || 3000;
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));


const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME
});


db.connect((err) => {
  if (err) {
    console.log("DB Connection Failed");
    return;
  }
  console.log("MySQL Connected");
});


app.get("/", (req, res) => {
  res.render("index", { result: null });
});


app.post("/result", (req, res) => {
  const { name, sub1, sub2, sub3 } = req.body;

  const s1 = parseInt(sub1);
  const s2 = parseInt(sub2);
  const s3 = parseInt(sub3);

  const avg = Math.round((s1 + s2 + s3) / 3);

  
  const insertQuery = `
    INSERT INTO sampleStudent (name, subject1, subject2, subject3)
    VALUES (?, ?, ?, ?)
  `;

  db.query(insertQuery, [name, s1, s2, s3], (err) => {
    if (err) {
      return res.send("Error saving student data");
    }

    
    const gradeQuery = `
      SELECT grade FROM grade_rules
      WHERE ? BETWEEN min_avg AND max_avg
      LIMIT 1
    `;

    db.query(gradeQuery, [avg], (err, gradeResult) => {
      if (err || gradeResult.length === 0) {
        return res.send("Grade not found");
      }

      const grade = gradeResult[0].grade;

      
      const traitQuery = `
        SELECT trait FROM personality_traits
        WHERE grade = ?
      `;

      db.query(traitQuery, [grade], (err, traitResult) => {
        if (err || traitResult.length === 0) {
          return res.send("Trait not found");
        }

        res.render("index", {
          result: {
            name,
            avg,
            grade,
            trait: traitResult[0].trait
          }
        });
      });
    });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});