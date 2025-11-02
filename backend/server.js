import express from "express";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

app.post("/generate-readme", async (req, res) => {
  try {
    const { repoName, repoDescription, languages, stars, topics } = req.body;

    // Combine all data into a single prompt for the AI endpoint
    const prompt = `
    Generate a clean, professional, and aesthetic README.md for a GitHub repo.
    Repo name: ${repoName}
    Description: ${repoDescription}
    Languages: ${languages}
    Stars: ${stars}
    Topics: ${topics}
    Format beautifully with headings, badges, and sections like Overview, Installation, Usage, and License.
    `;

    // Call the external AI API
    const response = await axios.post(
      "https://api.naxordeve.qzz.io/ai/chatgpt_3.5_scr1",
      {
        messages: [{ role: "user", content: prompt }]
      },
      {
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NAXOR_API_KEY   // optional if needed
        }
      }
    );

    const readme = response.data?.choices?.[0]?.message?.content || "Error: No content returned.";
    res.json({ readme });
  } catch (err) {
    console.error("Error:", err.message);
    res.status(500).json({ error: "Failed to generate README" });
  }
});

const port = process.env.PORT || 10000;
app.listen(port, () => console.log(`🚀 API running on port ${port}`));