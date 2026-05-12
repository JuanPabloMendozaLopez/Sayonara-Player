const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const downloadsDir = path.join(__dirname, "downloads");

if (!fs.existsSync(downloadsDir)) {
    fs.mkdirSync(downloadsDir);
}

app.post("/download", (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: "URL requerida" });
    }

    const id = Date.now();

    const output = path.join(
        downloadsDir,
        `${id}-%(title)s.%(ext)s`
    );

    const ffmpegPath = path.join(__dirname, "ffmpeg");

    const args = [
        "-m",
        "yt_dlp",
        "-x",
        "--audio-format",
        "mp3",
        "--no-cache-dir",
        "--ffmpeg-location",
        ffmpegPath,
        "-o",
        output,
        "--restrict-filenames",
        "--print",
        "after_move:filepath",
        url
    ];

    console.log("▶ yt-dlp START:", args.join(" "));

    const process = spawn("py", args);

    let outputData = "";
    let errorData = "";

    process.stdout.on("data", (data) => {
        outputData += data.toString();
    });

    process.stderr.on("data", (data) => {
        errorData += data.toString();
        console.log("STDERR:", data.toString());
    });

    process.on("close", () => {
        try {


        const filePath = outputData
            .split("\n")
            .map(l => l.trim())
            .filter(l => l.length > 0)
            .pop();

        console.log("RAW OUTPUT:\n", outputData);

            console.log("FILE:", filePath);

            if (!filePath || !fs.existsSync(filePath)) {
                return res.status(500).json({
                    error: "Archivo no encontrado",
                    debug: filePath,
                    stderr: errorData
                });
            }

            const fileBuffer = fs.readFileSync(filePath);
            const fileName = path.basename(filePath);

            res.json({
                fileName,
                file: fileBuffer.toString("base64")
            });

        } catch (err) {
            console.error(err);

            res.status(500).json({
                error: "Error leyendo archivo"
            });
        }
    });
});

app.get("/search", (req, res) => {
    const query = req.query.q;

    if (!query) {
        return res.status(400).json({ error: "Query requerida" });
    }

    const args = [
        `ytsearch10:${query}`,
        "--dump-json"
    ];

    const yt = spawn("py", ["-m", "yt_dlp", ...args]);

    let output = "";
    let error = "";

    yt.stdout.on("data", (data) => {
        output += data.toString();
    });

    yt.stderr.on("data", (data) => {
        error += data.toString();
    });

    yt.on("close", () => {
        try {
            const results = output
                .split("\n")
                .filter(Boolean)
                .map(line => {
                    try {
                        const json = JSON.parse(line);

                        return {
                            id: json.id,
                            title: json.title,
                            thumbnail: json.thumbnail,
                            duration: json.duration,
                            url: `https://www.youtube.com/watch?v=${json.id}`
                        };
                    } catch {
                        return null;
                    }
                })
                .filter(Boolean);

            res.json(results);

        } catch (err) {
            res.status(500).json({
                error: "Error procesando resultados",
                detail: error
            });
        }
    });
});

const GROQ_API_KEY = process.env.GROQ_API_KEY;

app.post("/metadata", async (req, res) => {
    const { title, artist } = req.body;

    console.log("INPUT GROQ TITLE:", title);
    console.log("INPUT GROQ ARTIST:", artist);

    if (!title) {
        return res.status(400).json({ error: "Título requerido" });
    }

    // 1. Limpiar título con Groq
    let cleanTitle = title;
    let cleanArtist = artist || "";

    try {
        const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: "qwen/qwen3-32b",
                messages: [
                    {
                        role: "system",
                        content: `Eres un sistema extractor de metadata musical extremadamente estricto.

                                    REGLAS INQUEBRANTABLES:
                                    - SOLO responde JSON válido.
                                    - NO explicaciones.
                                    - NO markdown.
                                    - NO texto adicional.

                                    FORMATO EXACTO:
                                    {"artist":"string","song":"string"}

                                    REGLAS CRÍTICAS:
                                    1. El artista NUNCA puede ser:
                                    - YouTube
                                    - Official
                                    - Topic
                                    - Auto-generated
                                    - Provided to YouTube
                                    - Music
                                    - Audio

                                    2. Si el campo "artist" contiene alguno de esos valores, es inválido.

                                    3. PRIORIDAD DE FUENTES:
                                    A. Si el título tiene formato "ARTISTA - CANCIÓN", usarlo.
                                    B. Si no, inferir artista SOLO del inicio del título.
                                    C. IGNORAR completamente el uploader si es genérico o plataforma.

                                    4. Ejemplo correcto:
                                    "twenty one pilots - Morph (Official Audio)"
                                    → {"artist":"twenty one pilots","song":"Morph"}

                                    RESPONDE SOLO JSON.`
                    },
                    {
                        role: "user",
                        content: `Título del video: "${title}"\nCanal/uploader: "${artist}"`
                    }
                ],
                temperature: 0.1,
                max_tokens: 100,
                reasoning_effort: "none"
            })
        });

        const groqData = await groqRes.json();
        const content = groqData.choices?.[0]?.message?.content?.trim();

        if (content) {
            const cleaned = content.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
            const parsed = JSON.parse(cleaned.replace(/```json|```/g, "").trim());
            
            cleanArtist = parsed.artist || cleanArtist;
            cleanTitle  = parsed.song  || cleanTitle;
        }

    // DESPUÉS:
    } catch (err) {
        console.error("Error con Groq:", err.message);
    }

    // 👇 Agrega esto justo ANTES del bloque de MusicBrainz para ver qué extrajo Groq:
    console.log("Groq extrajo → title:", cleanTitle, "| artist:", cleanArtist);

    // 2. Buscar en MusicBrainz
    let metadata = {
        title: cleanTitle,
        artist: cleanArtist,
        album: "",
        cover: null
    };

    try {
        // Buscar en orden normal
        const query1 = encodeURIComponent(`recording:"${cleanTitle}" AND artist:"${cleanArtist}"`);
        // Buscar con los campos invertidos
        const query2 = encodeURIComponent(`recording:"${cleanArtist}" AND artist:"${cleanTitle}"`);

        const [res1, res2] = await Promise.all([
            fetch(`https://musicbrainz.org/ws/2/recording/?query=${query1}&limit=1&fmt=json`, 
                { headers: { "User-Agent": "MiMusica/1.0 (contacto@ejemplo.com)" } }),
            fetch(`https://musicbrainz.org/ws/2/recording/?query=${query2}&limit=1&fmt=json`, 
                { headers: { "User-Agent": "MiMusica/1.0 (contacto@ejemplo.com)" } })
        ]);

        const [data1, data2] = await Promise.all([res1.json(), res2.json()]);

        const rec1 = data1.recordings?.[0];
        const rec2 = data2.recordings?.[0];

        // Usar el que tenga mejor score
        const recording = (rec1?.score >= (rec2?.score ?? 0)) ? rec1 : rec2;

        if (recording) {
            metadata.title  = recording.title || cleanTitle;
            metadata.artist = recording["artist-credit"]?.[0]?.name || cleanArtist;
            metadata.album  = recording.releases?.[0]?.title || "";

            // 3. Buscar cover art
            const releaseId = recording.releases?.[0]?.id;
            if (releaseId) {
                const coverRes = await fetch(
                    `https://coverartarchive.org/release/${releaseId}/front`,
                    { redirect: "follow" }
                );
                if (coverRes.ok) {
                    const coverBuffer = await coverRes.arrayBuffer();
                    const base64 = Buffer.from(coverBuffer).toString("base64");
                    const contentType = coverRes.headers.get("content-type") || "image/jpeg";
                    metadata.cover = `data:${contentType};base64,${base64}`;
                }
            }
        }

    } catch (err) {
        console.error("Error con MusicBrainz:", err.message);
    }

    res.json(metadata);
});

app.listen(3000, () => {
    console.log("Servidor iniciado en puerto 3000");
});

