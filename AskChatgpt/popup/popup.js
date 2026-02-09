import { generateCoverLetter } from "../scripts/PdfUtils.js";

console.log("Popup script loaded");


chrome.runtime.sendMessage({ 
    type: "SAVE_CV_PATH", 
    filePath: chrome.runtime.getURL("FCV_Arezki_Oussad.pdf")
}, (response) => {
    if (response && response.success) {
        console.log("CV path saved successfully in background.");
    } else {
        console.log("Failed to save CV path in background.");
    }
});


function countWords(text) {
    return text
        .trim()                           // Retire espaces début/fin
        .split(/\s+/)                     // Sépare sur espaces
        .filter(word => word.length > 0)  // Retire vides
        .length;
}


function addSuccessFulApplication(title) {
    const countEl = document.getElementById("applicationCount");
    let count = parseInt(countEl.textContent) || 0;
    count++;
    countEl.textContent = count;

    const jobAppliedList = document.getElementById("jobAppliedList");
    const newItem = document.createElement("li");
    newItem.textContent = title;
    jobAppliedList.appendChild(newItem);
}


document.addEventListener("DOMContentLoaded", () => {
    const askButton = document.getElementById("askButton");

    askButton.addEventListener("click", async () => {
        console.log("Ask Button clicked");

        // CHERCHER LE PROCHAIN JOB
        const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });

        while(true) {

            const nextJobLink = await chrome.tabs.sendMessage(activeTab.id, {
                type: "GET_NEXT_JOB",
            });

            if(nextJobLink.type === "NO_MORE_JOBS") {
                console.log("No more jobs available.");
                return;
            }

            // OUVRIR LE PROCHAIN JOB DANS UN NOUVEL ONGLET ET GET LES DETAILS
            const newTab = await chrome.tabs.create({ url: nextJobLink.link, active: false });
            const newTabId = newTab.id;

            await new Promise((resolve) => {
                chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo) {
                    if (tabId === newTabId && changeInfo.status === 'complete') {
                        chrome.tabs.onUpdated.removeListener(listener);
                        resolve();
                    }
                });
            });

            let jobData = await chrome.tabs.sendMessage(newTabId, {
                type: "GET_JOB_DETAILS",
            });
            if(jobData.type === "JOB_NOT_APPLIABLE") {
                console.log("Job not appliable, closing tab.");
                await chrome.tabs.remove(newTabId);
                continue;
            }
            console.log("Job details received in popup:", jobData);
            

            // ALLER SUR ONGLET CHAT DÉJÀ OUVERT ET LUI BALANCER LE PROMPT
            const {employer, title, description, requirements} = jobData;
            const prompt = `Rédige moi une lettre de motivation pour le poste suivant en te basant sur mon CV. Employeur: ${employer} Poste : ${title}. Description du poste : ${description}. Exigences du poste : ${requirements}. CV : [insérer le contenu du CV ici]. Lettre de motivation : Madame, Monsieur, [insérer le reste de la lettre ici] Arezki Oussad. Fais la très courte (environ 200 mots)`;
            
            const [chatGptTab] = await chrome.tabs.query({ 
                url: "https://chatgpt.com/*"
            });
            console.log("Found ChatGPT tab");

            if(!chatGptTab) {
                console.log("ChatGPT tab not found, stopping program.");
                await chrome.tabs.remove(newTabId);
                return;
            }

            console.log("Prompt sent to ChatGPT, waiting for response...");

            const response = await chrome.tabs.sendMessage(chatGptTab.id, {
                type: "PROMPT_CHATGPT",
                prompt: prompt
            });

            const wordCount = countWords(response.text);

            // Generate PDF with the response
            console.log("Generating PDF this number of words :", wordCount);
            if(wordCount < 50){
                console.log("Generated cover letter is too short, something wrong occured.");
                await chrome.tabs.remove(newTabId);
                return;
            }

            generateCoverLetter(response.text, title);

            console.log("Cover letter generated.");
            
            console.log("Applying to job...");

            //Postuler pour le job
            chrome.tabs.sendMessage(newTabId, {
                type: "APPLY_TO_JOB",
            });
            
            console.log("Application done!")
            addSuccessFulApplication(title);

            await new Promise((resolve) => setTimeout(resolve, 500));
            await chrome.tabs.remove(newTabId);
        }
    });
});
