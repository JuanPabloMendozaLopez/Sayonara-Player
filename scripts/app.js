// inicializar db
const request = indexedDB.open("myDB", 8);

request.onupgradeneeded = (e) => {
    db = e.target.result

    if (!db.objectStoreNames.contains("songs")) {
        db.createObjectStore("songs", { 
            keyPath: "id",
            autoIncrement: true 
        });
    }

    if (!db.objectStoreNames.contains("playlists")) {
        db.createObjectStore("playlists", { 
            keyPath: "playlistId", // 👈 nuevo nombre
            autoIncrement: true 
        });
    }
    
    let favoriteStore;

    if (!db.objectStoreNames.contains("favorites")) {
        favoriteStore = db.createObjectStore("favorites", { 
            keyPath: "songId" 
        });
    } else {
        favoriteStore = e.target.transaction.objectStore("favorites");
    }

    if (!favoriteStore.indexNames.contains("order")) {
        favoriteStore.createIndex("order", "order", {
            unique: false 
        });
    }

}

request.onsuccess = (e) => {
    db = e.target.result;
    loadSavedSongs();
    loadFavoriteSongs();
    loadSavedPlaylists();

//     const tx = db.transaction("favorites", "readwrite");
// const store = tx.objectStore("favorites");

// const req = store.clear();

// req.onsuccess = () => {
//     console.log("ObjectStore limpiado");
// };

// req.onerror = () => {
//     console.error("Error al limpiar");
// };

    // const tx = db.transaction("playlists", "readwrite");
    // const store = tx.objectStore("playlists");

    // const req = store.clear();

    // req.onsuccess = () => {
    //     console.log("ObjectStore limpiado");
    // };

    // req.onerror = () => {
    //     console.error("Error al limpiar");
    // };
}

//  SVG al inicio del archivo
const svg_favorite   =  `<svg width="800px" height="800px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M2 9.1371C2 14 6.01943 16.5914 8.96173 18.9109C10 19.7294 11 20.5 12 20.5C13 20.5 14 19.7294 15.0383 18.9109C17.9806 16.5914 22 14 22 9.1371C22 4.27416 16.4998 0.825464 12 5.50063C7.50016 0.825464 2 4.27416 2 9.1371Z" fill="currentColor"/>
                        </svg>`;
const svg_nofavorite = `<svg width="800px" height="800px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8.96173 18.9109L9.42605 18.3219L8.96173 18.9109ZM12 5.50063L11.4596 6.02073C11.601 6.16763 11.7961 6.25063 12 6.25063C12.2039 6.25063 12.399 6.16763 12.5404 6.02073L12 5.50063ZM15.0383 18.9109L15.5026 19.4999L15.0383 18.9109ZM9.42605 18.3219C7.91039 17.1271 6.25307 15.9603 4.93829 14.4798C3.64922 13.0282 2.75 11.3345 2.75 9.1371H1.25C1.25 11.8026 2.3605 13.8361 3.81672 15.4758C5.24723 17.0866 7.07077 18.3752 8.49742 19.4999L9.42605 18.3219ZM2.75 9.1371C2.75 6.98623 3.96537 5.18252 5.62436 4.42419C7.23607 3.68748 9.40166 3.88258 11.4596 6.02073L12.5404 4.98053C10.0985 2.44352 7.26409 2.02539 5.00076 3.05996C2.78471 4.07292 1.25 6.42503 1.25 9.1371H2.75ZM8.49742 19.4999C9.00965 19.9037 9.55954 20.3343 10.1168 20.6599C10.6739 20.9854 11.3096 21.25 12 21.25V19.75C11.6904 19.75 11.3261 19.6293 10.8736 19.3648C10.4213 19.1005 9.95208 18.7366 9.42605 18.3219L8.49742 19.4999ZM15.5026 19.4999C16.9292 18.3752 18.7528 17.0866 20.1833 15.4758C21.6395 13.8361 22.75 11.8026 22.75 9.1371H21.25C21.25 11.3345 20.3508 13.0282 19.0617 14.4798C17.7469 15.9603 16.0896 17.1271 14.574 18.3219L15.5026 19.4999ZM22.75 9.1371C22.75 6.42503 21.2153 4.07292 18.9992 3.05996C16.7359 2.02539 13.9015 2.44352 11.4596 4.98053L12.5404 6.02073C14.5983 3.88258 16.7639 3.68748 18.3756 4.42419C20.0346 5.18252 21.25 6.98623 21.25 9.1371H22.75ZM14.574 18.3219C14.0479 18.7366 13.5787 19.1005 13.1264 19.3648C12.6739 19.6293 12.3096 19.75 12 19.75V21.25C12.6904 21.25 13.3261 20.9854 13.8832 20.6599C14.4405 20.3343 14.9903 19.9037 15.5026 19.4999L14.574 18.3219Z" fill="currentColor"/>
                        </svg>`

const inputFile = document.querySelector("input[type=file]");
const audio = document.getElementById("audio");

const btnLyrics = document.getElementById('btn-lyrics');
const songCard = document.querySelector('.song-card');
const albumPortrait = document.querySelector(".album-portrait");
const songName = document.getElementById("song-name");
const artistName = document.getElementById("artist-name");
const startTime = document.getElementById("start-time");
const endTime = document.getElementById("end-time");
const btnPlayPause = document.querySelector(".btn-playpause");
const iconPlayPause = document.getElementById("icon-playpause");
const btn_addPlaylist = document.getElementById("btn-add-playlist");
const drop_zone = document.getElementById("guardados");
const playlist_back_btn = document.querySelector(".playlist-back-btn");

const footer = document.querySelector("footer");
const footerSongName = document.getElementById("footer-song-name");
const footerArtistName = document.getElementById("footer-artist-name");
const footerAlbumPortrait = footer.querySelector("img");
const footerIconPlayPause = document.getElementById("footer-icon-playpause");
const footerBtnPlayPause = document.querySelector(".footer-btn-playpause");
const footerStartTime = document.getElementById("footer-start-time");
const footerEndTime = document.getElementById("footer-end-time");
const inicioSection = document.querySelector("#inicio");

//  Seleccionar ambos ranges
const mainRange = document.querySelector("#inicio .track-bar input[type=range]");
const footerRange = document.querySelector("footer .track-bar input[type=range]");

let currentFile = null;
let currentTitle = "";
let currentArtist = "";
let currentSongId = null;

let currentContext = null;
let currentPlaylist = [];
let currentIndex = -1;

let currentPlaylistId = null;

let isUserSeeking = false; 

function updateRange(rangeElement) {
    if (!rangeElement) return;
    
    const min = rangeElement.min || 0;
    const max = rangeElement.max || 100;
    const val = rangeElement.value;

    const percent = ((val - min) / (max - min)) * 100;

    rangeElement.style.background = `linear-gradient(to right, #ddd ${percent}%, #787878 ${percent}%)`;
}

function isAudioPlaying() {
    return !audio.paused && !audio.ended && audio.currentTime > 0;
}

function updatePlayPauseButton() {
    updatePlayPauseButtonWithState(isAudioPlaying());
}

function updatePlayPauseButtonWithState(isPlaying) {
    if (isPlaying) {
        iconPlayPause.src = "assets/pause.png";
        footerIconPlayPause.src = "assets/pause.png";
    } else {
        iconPlayPause.src = "assets/play.png";
        footerIconPlayPause.src = "assets/play.png";
    }
}

playlist_back_btn.addEventListener("click", () => {

    showSection("playlists");

});

drop_zone.addEventListener("dragover", (e) => {

    e.preventDefault();
    e.stopPropagation();

});
drop_zone.addEventListener("drop", (e) => {
    e.preventDefault();
    e.stopPropagation();

    const files = [...e.dataTransfer.files].filter(file => 
        file.type.startsWith("audio/")
    );

    if (files.length === 0) return;

    loadAndSaveSongOnDrop(files);
});

let dragCounter = 0;

drop_zone.addEventListener("dragenter", (e) => {
    e.preventDefault();
    dragCounter++;
    drop_zone.classList.add("drag-active");
});

drop_zone.addEventListener("dragleave", (e) => {
    e.preventDefault();
    dragCounter--;

    if (dragCounter === 0) {
        drop_zone.classList.remove("drag-active");
    }
});

drop_zone.addEventListener("drop", (e) => {
    e.preventDefault();
    dragCounter = 0;
    drop_zone.classList.remove("drag-active");
});

audio.addEventListener("play", () => {
    console.log("EVENTO PLAY disparado");
    updatePlayPauseButtonWithState(true);
    updateSongListUIWithState(true);
});

audio.addEventListener("pause", () => {
    console.log("EVENTO PAUSE disparado");
    updatePlayPauseButtonWithState(false);
    updateSongListUIWithState(false);
});

audio.addEventListener("ended", () => {
    console.log("EVENTO ENDED disparado");
    updatePlayPauseButtonWithState(false);
    updateSongListUIWithState(false);

    let lastIndex = currentPlaylist.length - 1;
    if (lastIndex !== currentIndex) {
        playNext();
    }
    
});

function updateSongListUIWithState(isPlaying) {
    console.log("updateSongListUI llamado con isPlaying:", isPlaying);
    console.log("currentSongId:", currentSongId);
    console.log("currentContext:", currentContext);
    
    // Determinar qué selector usar según el contexto
    let contextSelector = "";
    
    if (currentContext === "saved") {
        contextSelector = ".song-list";
    } else if (currentContext === "favorites") {
        contextSelector = ".favorite-list";
    } else if (currentContext === "playlist") {
        contextSelector = ".playlist-song-list";
    }
    
    // Si no hay contexto válido, limpiar todo
    if (!contextSelector) {
        document.querySelectorAll(".song-item").forEach(item => {
            const picture_content = item.querySelector(".picture-content");
            const song_title = item.querySelector(".song-title");
            song_title?.classList.remove("selected");
            picture_content?.classList.remove("active");
        });
        return;
    }
    
    // Primero, limpiar TODOS los items de TODAS las secciones
    document.querySelectorAll(".song-item").forEach(item => {
        const picture_content = item.querySelector(".picture-content");
        const song_title = item.querySelector(".song-title");
        song_title?.classList.remove("selected");
        picture_content?.classList.remove("active");
    });
    
    // Luego, actualizar SOLO los items del contexto actual
    const contextItems = document.querySelectorAll(`${contextSelector} .song-item`);
    
    contextItems.forEach(song_item => {
        const picture_content = song_item.querySelector(".picture-content");
        const song_title = song_item.querySelector(".song-title");
        const id = Number(song_item.dataset.id);
        
        const isCurrentSong = currentSongId === id;
        
        if (isCurrentSong) {
            song_title.classList.add("selected");
            if (isPlaying) {
                console.log("Agregando clase active al item", id, "en contexto", currentContext);
                picture_content.classList.add("active");
            } else {
                console.log("Removiendo clase active del item", id);
                picture_content.classList.remove("active");
            }
        }
    });
}

function updateSongListUI() {
    updateSongListUIWithState(isAudioPlaying());
}

//  Solo actualiza si el usuario NO está arrastrando
function timeUpdate() {
    if (audio.ended || isUserSeeking) {
        return;
    }
    
    const currentTime = formatTime(audio.currentTime);
    const progress = (audio.currentTime / audio.duration) * 100;
    
    // Actualizar ambos displays de tiempo
    if (startTime) startTime.textContent = currentTime;
    if (footerStartTime) footerStartTime.textContent = currentTime;
    
    // Actualizar ambos ranges
    if (mainRange) {
        mainRange.value = progress;
        updateRange(mainRange);
    }
    
    if (footerRange) {
        footerRange.value = progress;
        updateRange(footerRange);
    }

    syncLyrics(audio.currentTime);
}

function loadedMetaData() {
    const duration = formatTime(audio.duration);
    if (endTime) endTime.textContent = duration;
    if (footerEndTime) footerEndTime.textContent = duration;
}

//  Maneja el arrastre visual
function handleRangeInput(rangeElement) {
    isUserSeeking = true; //  Bloquear actualizaciones automáticas
    
    // Sincronizar el otro range
    const value = rangeElement.value;
    if (rangeElement === mainRange && footerRange) {
        footerRange.value = value;
        updateRange(footerRange);
    } else if (rangeElement === footerRange && mainRange) {
        mainRange.value = value;
        updateRange(mainRange);
    }
    
    updateRange(rangeElement);
}

//  Maneja cuando suelta el mouse
function handleRangeChange(rangeElement) {
    if (!audio.duration) return;
    
    let seconds = (audio.duration * rangeElement.value) / 100;
    audio.currentTime = seconds;
    
    isUserSeeking = false; //  Permitir actualizaciones automáticas nuevamente
}

function saveAudio(song, file, picture) {
    const tx = db.transaction("songs", "readwrite");
    const store = tx.objectStore("songs");

    const req = store.add({
        ...song,
        file: file,
        picture: picture
    });

    req.onsuccess = (e) => {
        const id = e.target.result;
        song.id = id;
        
       
        
    };
}

function loadAndPlaySong(file) {
    if (!file) return;
    
    currentFile = file;

    jsmediatags.read(file, {
        onSuccess: function(tag) {
            const { title, artist, picture } = tag.tags;

            currentTitle = title || "Sin titulo";
            currentArtist = artist || "Artista desconocido";

            songName.textContent = currentTitle;
            artistName.textContent = currentArtist;
            footerSongName.textContent = currentTitle;
            footerArtistName.textContent = currentArtist;

            let pictureUrl;
            let defaultPicture = "assets/default.jpeg"
            if (picture) {
                let base64String = "";
                for (let i = 0; i < picture.data.length; i++) {
                    base64String += String.fromCharCode(picture.data[i]);
                }
                pictureUrl = `data:${picture.format};base64,${btoa(base64String)}`;
            } else {
                pictureUrl = defaultPicture;
            }

            albumPortrait.src = pictureUrl;
            footerAlbumPortrait.src = pictureUrl;

            if (pictureUrl !== defaultPicture) {
                applyColor(albumPortrait);
            }

            audio.removeEventListener("timeupdate", timeUpdate);
            audio.removeEventListener("loadedmetadata", loadedMetaData);
            
            let url = URL.createObjectURL(file);
            audio.src = url;
            
            audio.addEventListener("loadedmetadata", loadedMetaData);
            audio.addEventListener("timeupdate", timeUpdate);
            
            audio.play().catch(err => {
                console.log("Error al reproducir:", err);
            });

            const activeButton = document.querySelector('.navigation-button.active');
            const isInicio = activeButton?.dataset.section === "inicio";

            resetLyrics();

            obtenerLetra(currentTitle, currentArtist);
            
            toggleFooter(!isInicio);
        },
        onError: function(error) {
            console.log(error);
        }
    });
}

async function loadAndSaveSong() {

    let files = [...inputFile.files];
    const promises = [];

    for (let file of files) {

        if (!file) {
            continue;
        }

        const promise = new Promise((resolve) => {
            jsmediatags.read(file, {
                onSuccess: function(tag) {
                    const { title, artist, picture } = tag.tags;

                    const currentTitle = title || "Sin titulo";
                    const currentArtist = artist || "Artista desconocido";

                    let pictureUrl;

                    if (picture) {
                        
                        let base64String = "";
                        for (let i = 0; i < picture.data.length; i++) {
                            base64String += String.fromCharCode(picture.data[i]);
                        }
                        pictureUrl = `data:${picture.format};base64,${btoa(base64String)}`;

                    } else {
                        pictureUrl = "assets/default.jpeg";
                    }

                    let url = URL.createObjectURL(file);
                    const tempAudio = new Audio(url);

                    tempAudio.addEventListener("loadedmetadata", () => {

                        const song = {
                            title: currentTitle,
                            artist: currentArtist,
                            isFavorite: false,
                            duration: formatTime(tempAudio.duration)
                        };

                        saveAudio(song, file, pictureUrl);

                        URL.revokeObjectURL(url);
                        tempAudio.src = '';

                        resolve();

                    });

                },
                
                onError: function(error) {
                    console.log(error);
                    resolve();
                }
            });
        });

        promises.push(promise);

    }

    await Promise.all(promises);

    loadSavedSongs();
    
}

async function loadAndSaveSongOnDrop(filesInput) {

    let files = [...filesInput];
    const promises = [];

    for (let file of files) {

        if (!file) {
            continue;
        }

        const promise = new Promise((resolve) => {
            jsmediatags.read(file, {
                onSuccess: function(tag) {
                    const { title, artist, picture } = tag.tags;

                    const currentTitle = title || "Sin titulo";
                    const currentArtist = artist || "Artista desconocido";

                    let pictureUrl;

                    if (picture) {
                        
                        let base64String = "";
                        for (let i = 0; i < picture.data.length; i++) {
                            base64String += String.fromCharCode(picture.data[i]);
                        }
                        pictureUrl = `data:${picture.format};base64,${btoa(base64String)}`;

                    } else {
                        pictureUrl = "assets/default.jpeg";
                    }

                    let url = URL.createObjectURL(file);
                    const tempAudio = new Audio(url);

                    tempAudio.addEventListener("loadedmetadata", () => {

                        const song = {
                            title: currentTitle,
                            artist: currentArtist,
                            isFavorite: false,
                            duration: formatTime(tempAudio.duration)
                        };

                        saveAudio(song, file, pictureUrl);

                        URL.revokeObjectURL(url);
                        tempAudio.src = '';

                        resolve();

                    });

                },
                
                onError: function(error) {
                    console.log(error);
                    resolve();
                }
            });
        });

        promises.push(promise);

    }

    await Promise.all(promises);

    loadSavedSongs();
    
}

function formatTime(seconds) {
    if (isNaN(seconds)) return "0:00";
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec.toString().padStart(2, "0")}`;
}

const btn_add = document.getElementById("btn-add");
btn_add.addEventListener("click", () => {
    inputFile.setAttribute("data-action", "save");
    inputFile.value = "";
    inputFile.click();
});

inputFile.addEventListener("change", () => {
    const action = inputFile.getAttribute("data-action");
    let file = inputFile.files[0]; 
    
    if (action === "play") {
        loadAndPlaySong(file);
    } else if (action === "save") {
        loadAndSaveSong();
    }
    
    inputFile.removeAttribute("data-action");
});

function playPause() {
    if (!audio.src) return;
    
    if (isAudioPlaying()) {
        audio.pause();
    } else {
        audio.play();
    }
}

function playNext() {
    if (!currentContext) return;

    if (currentPlaylist.length === 0) return;

    const nextIndex = (currentIndex + 1) % currentPlaylist.length;
    const nextSongId = currentPlaylist[nextIndex];

    currentIndex = nextIndex;
    currentSongId = nextSongId;

    updateSongListUI();

    const tx = db.transaction("songs", "readonly");
    const store = tx.objectStore("songs");
    const req = store.get(nextSongId);

    req.onsuccess = () => {
        const song = req.result;
        if (song) loadAndPlaySong(song.file);
    };
}

function playPrevious() {
    if (!currentContext) return;

    if (currentPlaylist.length === 0) return;

    const prevIndex = currentIndex === 0 
        ? currentPlaylist.length - 1 
        : currentIndex - 1;

    const prevSongId = currentPlaylist[prevIndex];

    currentIndex = prevIndex;
    currentSongId = prevSongId;

    updateSongListUI();

    const tx = db.transaction("songs", "readonly");
    const store = tx.objectStore("songs");
    const req = store.get(prevSongId);

    req.onsuccess = () => {
        const song = req.result;
        if (song) loadAndPlaySong(song.file);
    };
}

const btnNext = document.querySelector(".btn-next");
const btnPrevious = document.querySelector(".btn-back");

if (btnNext) btnNext.addEventListener("click", playNext);
if (btnPrevious) btnPrevious.addEventListener("click", playPrevious);

const footerBtnNext = document.querySelector(".footer-btn-next");
const footerBtnPrevious = document.querySelector(".footer-btn-back");

if (footerBtnNext) footerBtnNext.addEventListener("click", playNext);
if (footerBtnPrevious) footerBtnPrevious.addEventListener("click", playPrevious);

if (btnPlayPause) btnPlayPause.addEventListener("click", playPause);
if (footerBtnPlayPause) footerBtnPlayPause.addEventListener("click", playPause);

const navigationButtons = document.querySelectorAll(".navigation-button");
const sections = document.querySelectorAll("section");

function showSection(sectionId) {
    sections.forEach(section => {
        section.style.display = "none";
    });

    navigationButtons.forEach(btn => {
        btn.classList.remove("active");

         if (sectionId === "playlist-view" || sectionId === "playlist-add") {

                let btnPlaylist = Array.from(navigationButtons).find(item => item.dataset.section === "playlists");
                btnPlaylist.classList.add("active");

        }

        if (btn.dataset.section === sectionId) {

            btn.classList.add("active");

        }
    });

    const section = document.getElementById(sectionId);
    section.style.display = "flex";

    updateMainOverflow(sectionId);

    const isInicio = sectionId === "inicio";
    const shouldShowFooter = !isInicio && currentSongId !== null;

    toggleFooter(shouldShowFooter);
    if (sectionId !== "playlist-view") {
        setTimeout(adjustFooterWidth, 200);
    }

    updatePlaylistViewRadius();
    
}

navigationButtons.forEach(button => {
    button.addEventListener("click", () => {
        showSection(button.dataset.section);
    });
});

showSection("playlists");

const section_playlist = document.getElementById("playlists");
const section_addplaylist = document.getElementById("playlist-add");
const btn_cancel = document.querySelector(".btn-cancel");

const btn_primary = document.querySelector(".btn-primary");
const btn_secondary = document.querySelector(".btn-secondary");

const playlistName = document.getElementById("playlistName");
const form_info = document.querySelector(".form-info")

let formListExists = false;

btn_secondary.addEventListener("click", () => {
    showSection("playlists");
    playlistName.value = "";
});

btn_cancel.addEventListener("click", () => {
    showSection("playlists");
    playlistName.value = "";
});

btn_addPlaylist.addEventListener("click", () => {
    showSection("playlist-add");
    loadSelectableSavedSongs();
});

const form = document.querySelector("form");

form.addEventListener("submit", (e) => {

    e.preventDefault();
    const form_list = document.querySelector(".form-list");
    const seleccionados = form_list.querySelectorAll("input[type='checkbox']:checked");
    const playlist = {
        name: playlistName.value.trim(),
        songsId: selectedSongsOrder
    };

    const tx = db.transaction("playlists", "readwrite");
    const store = tx.objectStore("playlists");
    
    const req = store.add(playlist);

    req.onsuccess = () => {

        console.log("se agrego con exito la nueva playlist");
        loadSavedPlaylists() 
        

    }

    tx.oncomplete = () => {

        playlistName.value = "";

    }

    showSection("playlists");

});

function loadSavedPlaylists() {

    
    const playlist_list = document.querySelector(".playlist-list");
    
    playlist_list.classList.remove("empty");
    playlist_list.innerHTML = "";

    const tx = db.transaction("playlists", "readonly");
    const store = tx.objectStore("playlists");

    const req = store.getAll();

    req.onsuccess = () => {
        const playlists = req.result;

        if (playlists.length === 0) {

            console.log("holaaaa");

            playlist_list.classList.add("empty");

            const noPlaylistHTML = document.createElement("div");

            noPlaylistHTML.classList.add("no-songs-item");
            
            noPlaylistHTML.innerHTML = `
                                        <svg width="800px" height="800px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M11 14L3 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                                            <path d="M11 18H3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                                            <path d="M18.875 14.1183C20.5288 15.0732 21.3558 15.5506 21.4772 16.2394C21.5076 16.4118 21.5076 16.5881 21.4772 16.7604C21.3558 17.4492 20.5288 17.9266 18.875 18.8815C17.2212 19.8363 16.3942 20.3137 15.737 20.0745C15.5725 20.0147 15.4199 19.9265 15.2858 19.814C14.75 19.3644 14.75 18.4096 14.75 16.4999C14.75 14.5902 14.75 13.6354 15.2858 13.1858C15.4199 13.0733 15.5725 12.9852 15.737 12.9253C16.3942 12.6861 17.2212 13.1635 18.875 14.1183Z" stroke="currentColor" stroke-width="1.5"/>
                                            <path d="M3 6L13.5 6M20 6L17.75 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                                            <path d="M20 10L9.5 10M3 10H5.25" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                                        </svg>
                                        <p>Aún no has creado ninguna playlist.</p>
                                    `

            playlist_list.appendChild(noPlaylistHTML);

        }

        

        playlists.forEach(playlist => {
            const playlistHTML = document.createElement("div");

            console.log("id de la playlist"+playlist.playlistId);

            playlistHTML.innerHTML = `
                <div class="playlist-item" data-id="${playlist.playlistId}">
                    <div class="playlist-cover"></div>
                    <div class="playlist-info">
                        <div>
                            <p class="playlist-name">${playlist.name}</p>
                            <p class="playlist-count">${playlist.songsId.length} canciones</p>
                        </div>
                        <button>
                            <svg width="800px" height="800px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M18 6L17.1991 18.0129C17.129 19.065 17.0939 19.5911 16.8667 19.99C16.6666 20.3412 16.3648 20.6235 16.0011 20.7998C15.588 21 15.0607 21 14.0062 21H9.99377C8.93927 21 8.41202 21 7.99889 20.7998C7.63517 20.6235 7.33339 20.3412 7.13332 19.99C6.90607 19.5911 6.871 19.065 6.80086 18.0129L6 6M4 6H20M16 6L15.7294 5.18807C15.4671 4.40125 15.3359 4.00784 15.0927 3.71698C14.8779 3.46013 14.6021 3.26132 14.2905 3.13878C13.9376 3 13.523 3 12.6936 3H11.3064C10.477 3 10.0624 3 9.70951 3.13878C9.39792 3.26132 9.12208 3.46013 8.90729 3.71698C8.66405 4.00784 8.53292 4.40125 8.27064 5.18807L8 6M14 10V17M10 10V17" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </button>
                    </div>
                </div>
            `;
            playlist_list.appendChild(playlistHTML);
        });

        activePlaylistItemEvents(".playlist-list .playlist-item")

    };
    
}

function activePlaylistItemEvents(selector) {

    const playlistItems = document.querySelectorAll(selector);

    playlistItems.forEach(item => {

        let id = Number(item.dataset.id);

        item.addEventListener("click", () => {
            openPlaylist(id);
            
        });

        const button = item.querySelector("button");

        button.addEventListener("click", (e) => {

            e.stopPropagation();

            const tx = db.transaction("playlists", "readwrite");
            const playlistStore = tx.objectStore("playlists");
            const req = playlistStore.delete(id);

            req.onsuccess = () => {

                console.log("Playlist eliminada");
                clearPlaylistView(id)
                
            }

            req.onerror = () => {
                console.log("Error al eliminar la playlist");
            };

            tx.oncomplete = () => {
                loadSavedPlaylists();
            }

        })

    });

}

function openPlaylist(playlistId) {

    const tx = db.transaction("playlists", "readonly");
    const store = tx.objectStore("playlists");

    const req = store.get(Number(playlistId));

    req.onsuccess = () => {
        const playlist = req.result;

        if (!playlist) return;

        const playlistViewCard = document.querySelector(".playlist-view-card");
        playlistViewCard.dataset.id = playlist.playlistId;
        const playlistViewName = document.querySelector(".playlist-view-name");
        playlistViewName.textContent = playlist.name;
        const playlistViewCount = document.querySelector(".playlist-view-count");
        playlistViewCount.textContent = playlist.songsId.length + " canciones";

        // Pasar callback que se ejecuta DESPUÉS de renderizar
        renderPlaylistSongs(playlist.songsId, () => {
            // Si esta playlist es la que se está reproduciendo, sincronizar UI
            if (currentContext === "playlist" && currentPlaylistId === Number(playlistId)) {
                updateSongListUI();
            }
        });
        
        showSection("playlist-view");
    };
}

function renderPlaylistSongs(songIds, onComplete) {

    const song_list = document.querySelector(".playlist-song-list");
    song_list.innerHTML = "";

    const tx = db.transaction("songs", "readonly");
    const store = tx.objectStore("songs");

    const songs = [];
    let loaded = 0;

    song_list.classList.remove("empty");

    if (!songIds || songIds.length === 0) {
        song_list.classList.add("empty");
        showEmpty();
        if (onComplete) onComplete(); // Ejecutar callback incluso si está vacío
        return;
    }

    // Mantener el orden original de la playlist
    const songMap = new Map();
    
    songIds.forEach(id => {
        const req = store.get(id);

        req.onsuccess = () => {
            const song = req.result;
            loaded++;

            if (song) {
                songMap.set(id, song);
            }

            // cuando TODOS terminaron
            if (loaded === songIds.length) {
                render();
            }
        };
    });

    function render() {

        if (songMap.size === 0) {
            showEmpty();
            if (onComplete) onComplete(); // Ejecutar callback
            return;
        }

        // Renderizar en el orden de la playlist (songIds)
        songIds.forEach(id => {
            const song = songMap.get(id);
            if (!song) return;

            const songHTML = document.createElement("div");

            songHTML.classList.add("song-item");
            songHTML.dataset.id = song.id;

            songHTML.innerHTML = `
                <div class="song-content">
                    <div class="picture-content">
                        <img src="${song.picture}">
                    </div>
                    <div>
                        <p class="song-title">${song.title}</p>
                        <p class="song-artist">${song.artist}</p>
                    </div>
                </div>
                <div class="song-controls">
                    <p>${song.duration}</p>
                    <button class="btn-delete">
                        <svg width="800px" height="800px" viewBox="0 0 512 512" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
                            <title>cancel</title>
                            <g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
                                <g id="work-case" fill="currentColor" transform="translate(91.520000, 91.520000)">
                                    <polygon id="Close" points="328.96 30.2933333 298.666667 1.42108547e-14 164.48 134.4 30.2933333 1.42108547e-14 1.42108547e-14 30.2933333 134.4 164.48 1.42108547e-14 298.666667 30.2933333 328.96 164.48 194.56 298.666667 328.96 328.96 298.666667 194.56 164.48">

                        </polygon>
                                </g>
                            </g>
                        </svg>
                    </button>
                </div>
            `;

            song_list.appendChild(songHTML);
        });
                    
        activeItemEvents(".playlist-song-list .song-item");
        
        // Ejecutar callback después de agregar eventos
        if (onComplete) onComplete();
    }

    function showEmpty() {
        const noSongsHTML = document.createElement("div");

        noSongsHTML.classList.add("no-songs-item");

        noSongsHTML.innerHTML = `
                                    <svg width="800px" height="800px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M9 19C9 20.1046 7.65685 21 6 21C4.34315 21 3 20.1046 3 19C3 17.8954 4.34315 17 6 17C7.65685 17 9 17.8954 9 19ZM9 19V5L21 3V17M21 17C21 18.1046 19.6569 19 18 19C16.3431 19 15 18.1046 15 17C15 15.8954 16.3431 15 18 15C19.6569 15 21 15.8954 21 17ZM9 9L21 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    </svg>
                                    <p>No hay canciones aquí todavía.</p>
                                    `;

        song_list.appendChild(noSongsHTML);
    }

    requestAnimationFrame(() => {
        updatePlaylistViewRadius();
    });

    const playlist_song_list = document.querySelector(".playlist-song-list");

    if (playlist_song_list) {
        playlist_song_list.addEventListener("scroll", updatePlaylistViewRadius);
    }
}



function validateForm() {
    const isName = playlistName.value.trim().length > 0;

    if (isName) {
        btn_primary.disabled = false;
        btn_primary.classList.add("active");
    } else {
        btn_primary.disabled = true;
        btn_primary.classList.remove("active");
    }
}

function loadSelectableSavedSongs() {

    selectedSongsOrder = [];

    formListExists = false;

    const oldLists = form_info.querySelectorAll(".form-list");
    oldLists.forEach(list => list.remove());
    const oldMessage = form_info.querySelectorAll(".warning-message");
    oldMessage.forEach(message => message.remove());

    const tx = db.transaction("songs", "readonly");
    const store = tx.objectStore("songs");

    const req = store.getAll();

    const form_list = document.createElement("div");
    form_list.classList.add("form-list");

    req.onsuccess = () => {
        const songs = req.result;

        if (songs.length === 0) {

            warning_message = document.createElement("p");
            warning_message.classList.add("warning-message");
            warning_message.innerHTML = "No tienes canciones guardadas. Añade algunas primero."
            form_info.appendChild(warning_message);
            return;
        }

        songs.forEach(song => {

            formListExists = true;

            const songHTML = document.createElement("div");
            songHTML.value = song.id

            songHTML.innerHTML = `
                <label class="checkbox-label">
                    <input type="checkbox" value="${song.id}">
                    <span class="checkmark"></span>

                    <div class="playlist-song-info">
                        <span class="playlist-song-name">${song.title}</span>
                        <span class="playlist-song-artist">${song.artist}</span>
                    </div>
                </label>
            `;

            form_list.appendChild(songHTML);
        });

        form_info.appendChild(form_list);
        activeCheckBoxEvents(".form-list .checkbox-label");
    };
}

playlistName.addEventListener("input", () => {
    validateForm();
});

let selectedSongsOrder = [];

function activeCheckBoxEvents(selector) {

    const checkbox_items = document.querySelectorAll(selector);

    checkbox_items.forEach(checkbox_item => {
        const checkbox = checkbox_item.querySelector("input[type='checkbox']");
        const songId = Number(checkbox.value);

        checkbox.addEventListener("change", () => {

            if (checkbox.checked) {
                // 👉 agregar al final (orden de selección)
                selectedSongsOrder.push(songId);
            } else {
                // 👉 quitar si se deselecciona
                selectedSongsOrder = selectedSongsOrder.filter(id => id !== songId);
            }

            validateForm();
        });

    });
}

function loadSavedSongs() {
    const song_list = document.querySelector(".song-list");
    song_list.innerHTML = "";

    const tx = db.transaction("songs", "readonly");
    const store = tx.objectStore("songs");

    const req = store.getAll();

    req.onsuccess = () => {
        const songs = req.result;

        if (songs.length === 0) {

            const noSongsHTML = document.createElement("div");

            noSongsHTML.classList.add("no-songs-item");
            
            noSongsHTML.innerHTML = `
                                        <svg width="800px" height="800px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M9 19C9 20.1046 7.65685 21 6 21C4.34315 21 3 20.1046 3 19C3 17.8954 4.34315 17 6 17C7.65685 17 9 17.8954 9 19ZM9 19V5L21 3V17M21 17C21 18.1046 19.6569 19 18 19C16.3431 19 15 18.1046 15 17C15 15.8954 16.3431 15 18 15C19.6569 15 21 15.8954 21 17ZM9 9L21 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                        </svg>
                                        <p>No hay canciones aquí todavía.</p>
                                    `

            song_list.appendChild(noSongsHTML);

        }

        songs.forEach(song => {
            const songHTML = document.createElement("div");

            songHTML.classList.add("song-item");
            songHTML.dataset.id = song.id;

            songHTML.innerHTML = `
            <div class="song-content">
                <div class="picture-content">
                    <img src="${song.picture}">
                </div>
                <div>
                    <p class="song-title">${song.title}</p>
                    <p class="song-artist">${song.artist}</p>
                </div>
            </div>
            <div class="song-controls">
                <p>${song.duration}</p>
                <button class="btn-favorite ${song.isFavorite ? `active` : ``}">
                    ${song.isFavorite ? 
                        svg_favorite : 
                        svg_nofavorite }
                </button>
                <button class="btn-delete">
                    <svg width="800px" height="800px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 6L17.1991 18.0129C17.129 19.065 17.0939 19.5911 16.8667 19.99C16.6666 20.3412 16.3648 20.6235 16.0011 20.7998C15.588 21 15.0607 21 14.0062 21H9.99377C8.93927 21 8.41202 21 7.99889 20.7998C7.63517 20.6235 7.33339 20.3412 7.13332 19.99C6.90607 19.5911 6.871 19.065 6.80086 18.0129L6 6M4 6H20M16 6L15.7294 5.18807C15.4671 4.40125 15.3359 4.00784 15.0927 3.71698C14.8779 3.46013 14.6021 3.26132 14.2905 3.13878C13.9376 3 13.523 3 12.6936 3H11.3064C10.477 3 10.0624 3 9.70951 3.13878C9.39792 3.26132 9.12208 3.46013 8.90729 3.71698C8.66405 4.00784 8.53292 4.40125 8.27064 5.18807L8 6M14 10V17M10 10V17" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </button>
            </div>
            `;

            song_list.appendChild(songHTML);
        });

        activeItemEvents(".song-list .song-item");
        updateSongListUI();
    };
}

function loadFavoriteSongs() {
    const favorite_list = document.querySelector(".favorite-list");
    favorite_list.innerHTML = "";

    const tx = db.transaction(["favorites", "songs"], "readonly");
    const favoriteStore = tx.objectStore("favorites");
    const songStore = tx.objectStore("songs");

    const index = favoriteStore.index("order");
    const favReq = index.getAll();
    const songReq = songStore.getAll();

    tx.oncomplete = () => {
        const favorites = favReq.result;
        const songs = songReq.result;

        console.log("hoal");
        console.log(favorites);

        if (favorites.length === 0) {

            const noSongsHTML = document.createElement("div");

            noSongsHTML.classList.add("no-songs-item");
            
            noSongsHTML.innerHTML = `
                                        <svg width="800px" height="800px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M9 19C9 20.1046 7.65685 21 6 21C4.34315 21 3 20.1046 3 19C3 17.8954 4.34315 17 6 17C7.65685 17 9 17.8954 9 19ZM9 19V5L21 3V17M21 17C21 18.1046 19.6569 19 18 19C16.3431 19 15 18.1046 15 17C15 15.8954 16.3431 15 18 15C19.6569 15 21 15.8954 21 17ZM9 9L21 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                        </svg>
                                        <p>No hay canciones aquí todavía.</p>
                                    `

            favorite_list.appendChild(noSongsHTML);
            return;

        }

        const songMap = new Map();
        songs.forEach(song => songMap.set(song.id, song));

        favorites.forEach(fav => {
            const song = songMap.get(fav.songId);
            if (!song) return;

            const songHTML = document.createElement("div");

            songHTML.classList.add("song-item");
            songHTML.dataset.id = song.id;

            songHTML.innerHTML = `
            <div class="song-content">
                <div class="picture-content">
                    <img src="${song.picture}">
                </div>
                <div>
                    <p class="song-title">${song.title}</p>
                    <p class="song-artist">${song.artist}</p>
                </div>
            </div>
            <div class="song-controls">
                <p>${song.duration}</p>
                <button class="btn-favorite active">
                    ${svg_favorite}
                </button>
            </div>
            `;

            favorite_list.appendChild(songHTML);
        });

        activeItemEvents(".favorite-list .song-item");
        updateSongListUI();
    };
}



function activeItemEvents(selector) {
    const song_items = document.querySelectorAll(selector);

    song_items.forEach(song_item => {
        const picture_content = song_item.querySelector(".picture-content");
        const id = Number(song_item.dataset.id);

        const btn_delete = song_item.querySelector(".btn-delete");
        const btn_favorite = song_item.querySelector(".btn-favorite");

        let isSongList = ".song-list .song-item" === selector;
        let isFavoriteList = ".favorite-list .song-item" === selector;
        let isPlaylistList = ".playlist-song-list .song-item" === selector;

        picture_content.addEventListener("click", () => {
            // Determinar el contexto de este item
            let itemContext = null;
            if (isSongList) {
                itemContext = "saved";
            } else if (isFavoriteList) {
                itemContext = "favorites";
            } else if (selector === ".playlist-song-list .song-item") {
                itemContext = "playlist";
            }
            
            const isCurrentSong = currentSongId === id;
            const isSameContext = currentContext === itemContext;
            
            // Solo pausar si es la misma canción Y el mismo contexto
            if (isCurrentSong && isSameContext) {
                playPause();
            } else {
                
                if (lyricsActive) {
                    btnLyrics.click();
                }
                // Nueva reproducción (cambio de canción o cambio de contexto)
                currentSongId = id;

                buildCurrentPlaylist();

                currentIndex = currentPlaylist.indexOf(id);

                updateSongListUI();

                const tx = db.transaction("songs", "readonly");
                const store = tx.objectStore("songs");
                const req = store.get(id);

                req.onsuccess = () => {
                    const song = req.result;
                    if (song) loadAndPlaySong(song.file);
                };
            }
        });

        if (isSongList || isPlaylistList) {

            btn_delete.addEventListener("click", () => {

                if (isSongList) {

                    const tx = db.transaction(["songs", "favorites", "playlists"], "readwrite");
                    const songStore = tx.objectStore("songs");
                    const favoriteStore = tx.objectStore("favorites");
                    const playlistStore = tx.objectStore("playlists");
                    const songReq = songStore.delete(id);

                    songReq.onsuccess = () => {

                        console.log("Cancion eliminada");

                        favoriteStore.delete(id);

                        const req = playlistStore.getAll();

                        req.onsuccess = () => {
                            req.result.forEach(pl => {

                                pl.songsId = pl.songsId.filter(song => song !== Number(id));

                                playlistStore.put(pl);

                            });
                        };

                        currentPlaylist = currentPlaylist.filter(item => item !== id);

                        if (currentSongId === id) {
                            clearSongCard();
                        }
                        
                    }

                    songReq.onerror = () => {
                        console.log("Error al eliminar la canción");
                    };

                    tx.oncomplete = () => {
                        loadSavedSongs();
                        loadFavoriteSongs();
                        loadSavedPlaylists();
                    }
                    
                } else {

                    const playlistViewCard = document.querySelector(".playlist-view-card");
                    let playlistId = Number(playlistViewCard.dataset.id);

                    const tx = db.transaction("playlists", "readwrite");
                    const playlistStore = tx.objectStore("playlists");
                    const req = playlistStore.get(playlistId);

                    req.onsuccess = () => {

                        let pl = req.result;

                        pl.songsId = pl.songsId.filter(song => song !== Number(id));

                        playlistStore.put(pl);

                        if (currentSongId === id) {
                            clearSongCard();
                        }


                    }

                    req.onerror = () => {
                        console.log("Error al remover la canción de la playlist");
                    };

                    tx.oncomplete = () => {

                        openPlaylist(playlistId);
                        loadSavedPlaylists();

                    }

                }

                

            });
            
        }

        if (isSongList || isFavoriteList) {
            btn_favorite.addEventListener("click", () => {
                const tx = db.transaction(["songs", "favorites"], "readwrite");
                const songStore = tx.objectStore("songs");
                const favoriteStore = tx.objectStore("favorites");
                const songReq = songStore.get(id);

                songReq.onsuccess = () => {
                    const song = songReq.result;

                    if (!song) {
                        console.log("La canción no existe");
                        return;
                    }

                    song.isFavorite = !song.isFavorite;

                    document.querySelectorAll(`[data-id="${id}"] .btn-favorite`).forEach(btn => {
                        if (song.isFavorite) {
                            btn.innerHTML = svg_favorite;
                            btn.classList.add("active");
                        } else {
                            btn.innerHTML = svg_nofavorite;
                            btn.classList.remove("active");
                        }
                    });

                    songStore.put(song);
                    
                    if (!song.isFavorite) {
                        favoriteStore.delete(id);
                        
                        const favoriteItem = document.querySelector(`.favorite-list [data-id="${id}"]`);
                        if (favoriteItem) {
                            favoriteItem.remove();
                        }

                    } else {
                        favoriteStore.put({
                            songId: id,
                            order: Date.now()
                        });
                    }
                };

                songReq.onerror = () => {
                    console.log("Error al procesar favorito");
                };

                tx.oncomplete = () => {
                    console.log("Favorito actualizado correctamente");
                    loadFavoriteSongs();
                };

                tx.onerror = () => {
                    console.log("Error en la transacción de favoritos");
                };
            });
        }

    });
}

function clearSongs() {
    const tx = db.transaction("songs", "readwrite");
    const store = tx.objectStore("songs");

    const req = store.clear(); 

    req.onsuccess = () => {
        console.log("Todas las canciones eliminadas");
        loadSavedSongs(); 
    };
}

function toggleFooter(show) {
    const footer = document.querySelector('footer');
    
    if (show) {
        footer.style.display = 'flex';
        document.body.classList.add('footer-visible');
    } else {
        footer.style.display = 'none';
        document.body.classList.remove('footer-visible');
    }

    updatePlaylistViewRadius();
}

function clearSongCard() {
    audio.removeEventListener("timeupdate", timeUpdate);
    audio.removeEventListener("loadedmetadata", loadedMetaData);
    
    audio.pause();
    audio.src = "";

    currentSongId = null;
    currentFile = null;
    currentTitle = "";
    currentArtist = "";

    songCard.style.background = "var(--color-bg-card)"
    songName.textContent = "Sin reproducir";
    artistName.textContent = "Artista desconocido";
    albumPortrait.src = "assets/default.jpeg";

    startTime.textContent = "0:00";
    endTime.textContent = "0:00";
    footerStartTime.textContent = "0:00";
    footerEndTime.textContent = "0:00";
    
    currentContext = null;
    currentPlaylist = [];
    currentIndex = -1;

    inicioSection.style.background = `
        linear-gradient(
        to bottom,
        var(--color-bg-surface),
        var(--color-bg-main)
    )
    `;

    if (mainRange) {
        mainRange.value = 0;
        mainRange.style.background = "#ddd";
    }
    
    if (footerRange) {
        footerRange.value = 0;
        footerRange.style.background = "#ddd";
    }
    
    updatePlayPauseButton();
    updateSongListUI();

    toggleFooter(false);
}

function clearPlaylistView(deletedPlaylistId) {

    // Si la playlist borrada es la que está abierta
    const playlistViewCard = document.querySelector(".playlist-view-card");
    const currentViewId = playlistViewCard ? Number(playlistViewCard.dataset.id) : null;

    if (currentViewId === deletedPlaylistId) {
        showSection("playlists"); // 👈 volver atrás
    }

    // Si la playlist borrada es la que se está reproduciendo
    if (currentContext === "playlist" && currentPlaylistId === deletedPlaylistId) {

        clearSongCard(); // 👈 limpias todo como hiciste antes

        currentPlaylistId = null;
    }

}

function adjustFooterWidth() {
    const footer = document.querySelector('footer');
    const main = document.querySelector('main');
    
    const hasScrollbar = main.scrollHeight > main.clientHeight;
    const scrollbarWidth = hasScrollbar ? 15 : 0;
    
    footer.style.width = `calc(100vw - 280px - 60px - ${scrollbarWidth}px)`;
}

function applyColor(img) {

    let colorThief = new ColorThief();
    const palette = colorThief.getPalette(img, 5);

    // 👉 elegir el color más "intenso"
    const bestColor = palette.reduce((best, current) => {
        const currentScore = getColorScore(current);
        const bestScore = getColorScore(best);
        return currentScore > bestScore ? current : best;
    });

    applyBackground(bestColor);
}

function getColorScore([r, g, b]) {
    // saturación simple (qué tan "vivo" es el color)
    return Math.max(r, g, b) - Math.min(r, g, b);
}

function applyShadow(color) {
    songCard.style.boxShadow = `
        0px 10px 30px rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.6),
        0px 0px 80px rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.5)
    `;
}

function applyBackground(color) {
    inicioSection.style.background = `
        linear-gradient(
            to bottom,
            rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.4),
            #141414
        )
    `;
}

//  Conectar eventos de los ranges
if (mainRange) {
    mainRange.addEventListener("input", () => handleRangeInput(mainRange));
    mainRange.addEventListener("change", () => handleRangeChange(mainRange));
    updateRange(mainRange);
}

if (footerRange) {
    footerRange.addEventListener("input", () => handleRangeInput(footerRange));
    footerRange.addEventListener("change", () => handleRangeChange(footerRange));
    updateRange(footerRange);
}

function buildCurrentPlaylist() {
    // Detectar qué sección está visible (no solo el botón activo)
    const visibleSection = Array.from(sections).find(s => s.style.display === "flex");
    const sectionId = visibleSection?.id;
 
    let selector = "";
    let newContext = null;
 
    if (sectionId === "guardados") {
        newContext = "saved";
        selector = ".song-list .song-item";
    } 
    else if (sectionId === "favoritos") {
        newContext = "favorites";
        selector = ".favorite-list .song-item";
    } 
    else if (sectionId === "playlist-view") {  
        const playlistViewCard = document.querySelector(".playlist-view-card");
        const viewPlaylistId = playlistViewCard ? Number(playlistViewCard.dataset.id) : null;
        
        newContext = "playlist";
        selector = ".playlist-song-list .song-item";
        
        // Actualizar el ID de la playlist actual
        currentPlaylistId = viewPlaylistId;
    }
    else {
        // Si no hay contexto válido, NO resetear la playlist actual
        return;
    }
 
    // Actualizar el contexto y reconstruir la cola
    currentContext = newContext;
    const items = document.querySelectorAll(selector);
    currentPlaylist = Array.from(items).map(item => Number(item.dataset.id));
}
function updateMainOverflow(sectionId) {
    const main = document.querySelector("main");
    const footer = document.querySelector("footer");
    const section = document.getElementById(sectionId);

    if (!section) return;

    // reset scroll
    main.scrollTop = 0;

    // detectar playlist-view
    const isPlaylistView = sectionId === "playlist-view";

    if (isPlaylistView) {
        // bloquear scroll del main
        main.style.overflow = "hidden";

        // calcular ancho del section dentro del main
        const sectionRect = section.getBoundingClientRect();
        const mainRect = main.getBoundingClientRect();

        const leftOffset = sectionRect.left - mainRect.left;
        const width = sectionRect.width;

        // ajustar footer SOLO a ese section
        footer.style.display = "flex";
        footer.style.position = "fixed";
        footer.style.left = `${mainRect.left + leftOffset}px`;
        footer.style.width = `${width}px`;
    } else {
        // comportamiento normal
        main.style.overflow = "auto";

        footer.style.position = "fixed";
        footer.style.left = "";
        footer.style.width = "";
    }
}

function updatePlaylistViewRadius() {
    const main = document.querySelector("main");
    const list = document.querySelector(".playlist-song-list");

    if (!main || !list) return;

    const isScrollable = list.scrollHeight > list.clientHeight;
    const hasFooter = document.body.classList.contains("footer-visible");

    if (isScrollable || hasFooter) {
        main.style.borderTopRightRadius = "0";
        main.style.borderBottomRightRadius = "0";
    } else {
        main.style.borderTopRightRadius = "20px";
        main.style.borderBottomRightRadius = "20px";
    }
}
const playlist_song_list = document.querySelector(".playlist-song-list");
playlist_song_list.addEventListener("scroll", updatePlaylistViewRadius);

window.addEventListener("resize", () => {
    const activeSection = document.querySelector("section[style*='flex']");
    
    if (!activeSection) return;

    const sectionId = activeSection.id;

    // 👇 SOLO recalcular si el footer YA está visible
    const isFooterVisible = document.body.classList.contains("footer-visible");

    if (!isFooterVisible) return;

    if (sectionId === "playlist-view") {
        updateMainOverflow(sectionId);
    } else {
        adjustFooterWidth();
    }
});

const btnPlayPlaylist = document.querySelector(".playlist-view-play");

btnPlayPlaylist.addEventListener("click", () => {
    const playlistViewCard = document.querySelector(".playlist-view-card");
    const viewPlaylistId = Number(playlistViewCard.dataset.id);

    const songPlaylists = document.querySelectorAll(".playlist-song-list .song-item"); 

    if (songPlaylists.length === 0) {
        return;
    }
    
    // Verificar si ya está reproduciendo ESTA playlist específica
    const isPlayingThisPlaylist = currentContext === "playlist" && 
                                   currentPlaylistId === viewPlaylistId && 
                                   currentSongId !== null;

    if (isPlayingThisPlaylist) {

        if (isAudioPlaying()) {

            btnPlayPlaylist.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M8 5v14l11-7z"/>
                                        </svg>`

            
            
        } else {

            btnPlayPlaylist.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M7 5h3v14H7zM14 5h3v14h-3z"/>
                                        </svg>`
            
        }

        // Solo pausar/reanudar
        playPause();
    } else {

        btnPlayPlaylist.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M7 5h3v14H7zM14 5h3v14h-3z"/>
                                        </svg>`

        // Reconstruir la cola desde los items del DOM (igual que buildCurrentPlaylist)
        currentContext = "playlist";
        currentPlaylistId = viewPlaylistId;
        
        const items = document.querySelectorAll(".playlist-song-list .song-item");
        currentPlaylist = Array.from(items).map(item => Number(item.dataset.id));
        
        if (currentPlaylist.length === 0) return;
        
        currentSongId = currentPlaylist[0];
        currentIndex = 0;

        updateSongListUI();

        const tx = db.transaction("songs", "readonly");
        const store = tx.objectStore("songs");
        const req = store.get(currentSongId);

        req.onsuccess = () => {
            const song = req.result;
            if (song) loadAndPlaySong(song.file);
        };
    }
});

let lyricsActive = false;
let letras = [];
let indiceActual = 0;
let itemsLetras = [];

const lyrics = document.getElementById("lyrics");
lyrics.style.display = "none";

btnLyrics.addEventListener("click", () => {

    btnLyrics.classList.toggle('active');
    lyricsActive = !lyricsActive;
    if (lyricsActive) {
        songCard.style.display = "none";
        lyrics.style.display = "flex";
    } else {
        songCard.style.display = "flex"
        lyrics.style.display = "none";
    }
});

let requestId = 0;
let ultimaCancion = null;

window.addEventListener("online", () => {

    if (!ultimaCancion) return;

    obtenerLetra(
        ultimaCancion.trackName,
        ultimaCancion.trackArtist
    );
});

obtenerLetra("", "");

async function obtenerLetra(trackName, trackArtist) {

    ultimaCancion = {
        trackName,
        trackArtist
    };


    let currentSong = songName.textContent;

    if (currentSong === "Sin reproducir") {
        mostrarEstadoLyrics(
            "idle",
            "Nada reproduciéndose",
            "Selecciona una canción para ver las letras."
        );

        return;
    }    

    const currentRequest = ++requestId;

    mostrarEstadoLyrics(
        "loading",
        "Cargando letras...",
        "Estamos buscando letras sincronizadas."
    );

  try {
    const url = `https://lrclib.net/api/get?track_name=${encodeURIComponent(trackName)}&artist_name=${encodeURIComponent(trackArtist)}`;

    const res = await fetch(url);

     if (currentRequest !== requestId) return;

    if (!res.ok) {
        letras = [];
        mostrarEstadoLyrics(
                "no-lyrics",
                "Sin letras disponibles",
                "No encontramos letras sincronizadas para esta canción."
            );
        return;
    }

    const data = await res.json();

    if (!data.syncedLyrics) {
        letras = [];
        mostrarEstadoLyrics(
                "no-lyrics",
                "Sin letras disponibles",
                "No encontramos letras sincronizadas para esta canción."
            );
        return;
    }

    letras = parseLRC(data.syncedLyrics);
    indiceActual = 0; // 🔥 reset al cargar nueva canción

    mostrarLetras(letras); // 👈 SOLO aquí

  } catch (error) {
    mostrarEstadoLyrics(
            "offline",
            "Sin conexión",
            "Revisa tu conexión a internet o inténtalo mas tarde."
        );
  }
}

function parseLRC(lrc) {
  return lrc.split("\n").map(line => {
    const match = line.match(/\[(\d+):(\d+(?:\.\d+)?)\](.*)/);
    if (!match) return null;

    return {
      tiempo: parseFloat(match[1]) * 60 + parseFloat(match[2]), // ✅ parseFloat en ambos
      texto: match[3].trim()
    };
  }).filter(Boolean);
}

function syncLyrics(tiempoActual) {
    if (!letras.length) return;

    // Buscar la línea correcta basada en el tiempo actual
    let nuevoIndice = indiceActual;

    // Avanzar si el tiempo actual ya pasó la siguiente línea
    while (nuevoIndice < letras.length - 1 && 
           tiempoActual >= letras[nuevoIndice + 1].tiempo) {
        nuevoIndice++;
    }

    // Retroceder si el tiempo actual está antes de la línea actual
    while (nuevoIndice > 0 && 
           tiempoActual < letras[nuevoIndice].tiempo) {
        nuevoIndice--;
    }

    // Solo actualizar si cambió
    if (nuevoIndice !== indiceActual) {
        indiceActual = nuevoIndice;
        actualizarLineaActiva();
    }
}

function actualizarLineaActiva() {
    itemsLetras.forEach(el => el.classList.remove("activo"));

    if (itemsLetras[indiceActual]) {
        const active = itemsLetras[indiceActual];

        active.classList.add("activo");

        active.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });
    }
}

function mostrarEstadoLyrics(tipo, titulo, subtitulo) {

    const div = document.getElementById("lyrics");

    let icono = "";

    switch (tipo) {

        case "loading":
            icono = `
                <svg viewBox="0 0 24 24" fill="none" class="spin">
                    <path
                        d="M12 3V6"
                        stroke="currentColor"
                        stroke-width="1.8"
                        stroke-linecap="round"
                    />

                    <path
                        d="M12 18V21"
                        stroke="currentColor"
                        stroke-width="1.8"
                        stroke-linecap="round"
                    />

                    <path
                        d="M4.93 4.93L7.05 7.05"
                        stroke="currentColor"
                        stroke-width="1.8"
                        stroke-linecap="round"
                    />

                    <path
                        d="M16.95 16.95L19.07 19.07"
                        stroke="currentColor"
                        stroke-width="1.8"
                        stroke-linecap="round"
                    />

                    <path
                        d="M3 12H6"
                        stroke="currentColor"
                        stroke-width="1.8"
                        stroke-linecap="round"
                    />

                    <path
                        d="M18 12H21"
                        stroke="currentColor"
                        stroke-width="1.8"
                        stroke-linecap="round"
                    />

                    <path
                        d="M4.93 19.07L7.05 16.95"
                        stroke="currentColor"
                        stroke-width="1.8"
                        stroke-linecap="round"
                    />

                    <path
                        d="M16.95 7.05L19.07 4.93"
                        stroke="currentColor"
                        stroke-width="1.8"
                        stroke-linecap="round"
                    />
                </svg>
            `;
            break;

        case "offline":
            icono = `
                <svg viewBox="0 0 24 24" fill="none">
                    <path
                        d="M3 9C7.5 5 16.5 5 21 9"
                        stroke="currentColor"
                        stroke-width="1.6"
                        stroke-linecap="round"
                    />

                    <path
                        d="M6 12.5C9.5 9.5 14.5 9.5 18 12.5"
                        stroke="currentColor"
                        stroke-width="1.6"
                        stroke-linecap="round"
                    />

                    <path
                        d="M9.5 16C11 15 13 15 14.5 16"
                        stroke="currentColor"
                        stroke-width="1.6"
                        stroke-linecap="round"
                    />

                    <path
                        d="M3 3L21 21"
                        stroke="currentColor"
                        stroke-width="1.8"
                        stroke-linecap="round"
                    />
                </svg>
            `;
            break;

        case "idle":
            icono = `
                <svg viewBox="0 0 24 24" fill="none">
                    <path
                        d="M8 6V18L18 12L8 6Z"
                        stroke="currentColor"
                        stroke-width="1.8"
                        stroke-linejoin="round"
                    />
                </svg>
            `;
            break;

        default:
            icono = `
                <svg viewBox="0 0 24 24" fill="none">
                    <path
                        d="M9 18C9 19.1046 7.88071 20 6.5 20C5.11929 20 4 19.1046 4 18C4 16.8954 5.11929 16 6.5 16C7.88071 16 9 16.8954 9 18ZM9 18V6L20 4V16"
                        stroke="currentColor"
                        stroke-width="1.5"
                    />

                    <path
                        d="M20 16C20 17.1046 18.8807 18 17.5 18C16.1193 18 15 17.1046 15 16C15 14.8954 16.1193 14 17.5 14C18.8807 14 20 14.8954 20 16Z"
                        stroke="currentColor"
                        stroke-width="1.5"
                    />
                </svg>
            `;
    }

    div.innerHTML = `
        <div class="no-lyrics">

            <div class="no-lyrics-icon">
                ${icono}
            </div>

            <p class="no-lyrics-title">${titulo}</p>

            <p class="no-lyrics-subtitle">
                ${subtitulo}
            </p>

        </div>
    `;

    itemsLetras = [];
}

function mostrarSinLetras() {
    const div = document.getElementById("lyrics");

    div.innerHTML = `
        <div class="no-lyrics">
            <div class="no-lyrics-icon">
                <svg viewBox="0 0 24 24" fill="none">
                    <path d="M9 18C9 19.1046 7.88071 20 6.5 20C5.11929 20 4 19.1046 4 18C4 16.8954 5.11929 16 6.5 16C7.88071 16 9 16.8954 9 18ZM9 18V6L20 4V16" stroke="currentColor" stroke-width="1.5"/>
                    <path d="M20 16C20 17.1046 18.8807 18 17.5 18C16.1193 18 15 17.1046 15 16C15 14.8954 16.1193 14 17.5 14C18.8807 14 20 14.8954 20 16Z" stroke="currentColor" stroke-width="1.5"/>
                </svg>
            </div>
            <p class="no-lyrics-title">Sin letras disponibles</p>
            <p class="no-lyrics-subtitle">No encontramos letras sincronizadas para esta canción.</p>
        </div>
    `;

    itemsLetras = [];
}

function mostrarLetras(letras) {
    const div = document.getElementById("lyrics");
    div.innerHTML = "";

    letras.forEach((l, index) => {
        const li = document.createElement("p");
        li.textContent = l.texto;

        div.appendChild(li);

        // 👉 animación progresiva
        setTimeout(() => {
            li.classList.add("show");
        }, index * 30);
    });

    itemsLetras = document.querySelectorAll("#lyrics p");
}

function resetLyrics() {
    letras = [];
    indiceActual = 0;
    itemsLetras = [];

    const div = document.getElementById("lyrics");
    div.innerHTML = ""; // limpia lo anterior
}