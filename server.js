const express = require("express");
const bodyParser = require("body-parser");
const carbone = require("carbone");
const fs = require("fs");
const path = require("path");
const app = express();
const port = 5000;

// Middleware
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ extended: true }));

// Directory to store uploaded templates
const templatesDir = path.join(__dirname, "templates");

// Ensure the templates directory exists
if (!fs.existsSync(templatesDir)) {
  fs.mkdirSync(templatesDir);
}

// Helper function to save a template file
function saveTemplate(templateName, templateContent) {
  const filePath = path.join(templatesDir, templateName);
  fs.writeFileSync(filePath, templateContent, "base64");
  return filePath;
}

// Route to upload a template
app.post("/add-template", (req, res) => {
  const { templateName, templateExtension, templateBase64 } = req.body;

  try {
    const templateFileName = `${templateName}.${templateExtension}`;
    saveTemplate(templateFileName, templateBase64); // No need to store in memory

    return res.json({ status: 1, message: "Template uploaded successfully", templateId: templateFileName });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: 0, message: "Error uploading template" });
  }
});

// Route to get all templates
app.get("/get-templates", (req, res) => {
  try {
    const templates = fs.readdirSync(templatesDir); // Read templates from disk
    return res.json({ status: 1, templates });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: 0, message: "Error getting templates" });
  }
});

// Route to render a template with data
app.post("/render-template/:templateId", (req, res) => {
  const { templateId } = req.params;
  const data = req.body;

  const templateFilePath = path.join(templatesDir, templateId);

  // Check if the template file exists
  if (!fs.existsSync(templateFilePath)) {
    return res.status(404).json({ status: 0, message: "Template not found" });
  }

  carbone.render(templateFilePath, data, { convertTo: "pdf" }, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ status: 0, message: "Error rendering template" });
    }

    const base64Result = Buffer.from(result).toString("base64");
    return res.json({ status: 1, renderId: templateId, result: base64Result });
  });
});

// Route to download a template
app.get("/get-template/:templateId", (req, res) => {
  const { templateId } = req.params;

  // Construct the file path from the templateId
  const templateFilePath = path.join(__dirname, "templates", templateId);

  // Check if the templateId is provided
  if (!templateId) {
    return res.status(400).json({ status: 0, message: "Template ID not provided" });
  }

  fs.readFile(templateFilePath, { encoding: "base64" }, (err, data) => {
    if (err) {
      if (err.code === "ENOENT") {
        // File does not exist
        return res.status(404).json({ status: 0, message: "Template not found" });
      } else {
        // Other errors
        console.error(err);
        return res.status(500).json({ status: 0, message: "Error reading template" });
      }
    }

    return res.json({ status: 1, templateContent: data });
  });
});

// Route to delete a template
app.delete("/delete-template/:templateId", (req, res) => {
  const { templateId } = req.params;

  const templateFilePath = path.join(__dirname, "templates", templateId); // Adjust the path as needed

  if (!templateId) {
    return res.status(400).json({ status: 0, message: "Template ID not provided" });
  }

  fs.unlink(templateFilePath, (err) => {
    if (err) {
      if (err.code === "ENOENT") {
        // File does not exist
        return res.status(404).json({ status: 0, message: "Template not found" });
      } else {
        // Other errors
        console.error(err);
        return res.status(500).json({ status: 0, message: "Error deleting template" });
      }
    }

    return res.json({ status: 1, message: "Template deleted successfully" });
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
