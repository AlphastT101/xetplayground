//// Settings button start ////
document.getElementById('config-button').addEventListener('click', function() {
    const overlay = document.getElementById('overlay');
    const settingsWindow = document.getElementById('settingsWindow');

    overlay.classList.add('show');
    settingsWindow.classList.add('show');
});

document.getElementById('overlay').addEventListener('click', function() {
    const overlay = document.getElementById('overlay');
    const settingsWindow = document.getElementById('settingsWindow');

    overlay.classList.remove('show');
    settingsWindow.classList.remove('show');
});

document.getElementById('closeSettings').addEventListener('click', function() {
    const overlay = document.getElementById('overlay');
    const settingsWindow = document.getElementById('settingsWindow');

    overlay.classList.remove('show');
    settingsWindow.classList.remove('show');
});


//// on model change ////
function toggleImageSize() {
    const modelInput = document.getElementById('modelInput');
    const sizeInput = document.getElementById('sizeInput');
    const sizeLabel = document.getElementById('sizeLabel');

    const imageModels = ['poli', 'sdxl-turbo', 'flux-dev', 'flux-schnell'];

    if (imageModels.includes(modelInput.value)) {
        sizeInput.style.display = 'inline-block';
        sizeLabel.style.display = 'block';
    } else {
        sizeInput.style.display = 'none';
        sizeLabel.style.display = 'none';
    }
}



//// API requests start ////
const text_models = [
'llama-3.3-70b-turbo', 'phi-4', 'deepseek-r1', 'deepseek-v3',
'deepseek-r1-llama-3.3-70b-distill', 'lunaris-l3-8b', 'wazardlm-2-8x22b',
'mythomax-13b', 'mistral-nemo', 'gemini-1.5-flash', 'gemini-1.5-pro',
'gemma-2-27b', 'gemma-2-9b-turbo', 'llama-3-70b-intruct', 'llama-3.1-70b',
'llama-3.1-70b-instruct', 'llama-3.1-8b-turbo', 'llama-3.3-70b', 'qwen-2.5-coder-32b',
'qwq-32b'
];

document.getElementById('send').addEventListener('click', async function() {
    await process_request();
});

const promptInput = document.getElementById('promptInput');
promptInput.addEventListener('input', function () {
    this.style.height = 'auto';
    this.style.height = `${Math.min(this.scrollHeight, 242)}px`;
});

promptInput.addEventListener('keypress', function (event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        process_request();
    }
});

async function formatText(answer) {
    answer = escapeHTML(answer);

    // Code Block: ```language code ```
    answer = answer.replace(/```(\w+)?\n([\s\S]*?)```/g,
        (match, lang, code) => {
            // Escape any additional backticks inside the code block
            code = code.replace(/</g, "&lt;").replace(/>/g, "&gt;");
            return `<pre class="code-block-wrapper"><button class="copy-btn">Copy</button><code class="language-${lang || 'plaintext'}">${code}</code></pre>`;
        }
    );

    // Bold + Italic: ***text***
    answer = answer.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');

    // Bold: **text**
    answer = answer.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Italic: *text*
    answer = answer.replace(/(\*)(.*?)\1/g, '<em>$2</em>');

    // Strikethrough: ~~text~~
    answer = answer.replace(/~~(.*?)~~/g, '<del>$1</del>');

    // Inline Code: `code`
    answer = answer.replace(/`([^`]+)`/g, '<code style="background: #2e2533;padding: 3px;color:white;">$1</code>');

    // Block Quotes: > text
    answer = answer.replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>');
    answer = answer.replace(/^>> (.*$)/gim, '<blockquote><blockquote>$1</blockquote></blockquote>');

    // Ordered Lists: 1. item
    answer = answer.replace(/^\d+\.\s(.*$)/gim, '<li>$1</li>');
    answer = answer.replace(/(<\/li>\n<li>)/g, '</li><li>');
    answer = answer.replace(/(<li>.*<\/li>)/g, '<ol>$1</ol>');

    // Unordered Lists: - item or + item or * item
    answer = answer.replace(/^[-\*\+]\s(.*$)/gim, '<li>$1</li>');
    answer = answer.replace(/(<\/li>\n<li>)/g, '</li><li>');
    answer = answer.replace(/(<li>.*<\/li>)/g, '<ul>$1</ul>');

    // Hyperlinks: [text](url)
    answer = answer.replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g, '<a href="$2" target="_blank">$1</a>');

    return answer;
}


function escapeHTML(html) {
    return html
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

let messages = [];
async function process_request() {
    const prompt = document.getElementById('promptInput').value;
    const apiKey = document.getElementById('apiKeyInput').value;
    const model = document.getElementById('modelInput').value;
    const size = document.getElementById('sizeInput').value;
    const chatHistory = document.querySelector('.chat-history');
    const btn = document.getElementById('send');
    const loading = document.getElementById('loading');
    const errorWindow = document.getElementById('errorWindow');

    // disable buttons
    function setUIBusyState(isBusy) {
        btn.style.display = isBusy ? 'none' : 'inline-block';
        loading.style.display = isBusy ? 'inline-block' : 'none';
    }
    // error message
    function showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-response';
        errorDiv.dataset.aos = 'fade';
        errorDiv.innerHTML = message;
        chatHistory.appendChild(errorDiv)
    }

    setUIBusyState(true); // disable btn

    try {
        if (!apiKey || !prompt) {
            throw new Error("You must set your API key and a message to get a response.");
        }

        const newUserDiv = document.createElement('div');
        newUserDiv.className = 'text-user';
        newUserDiv.dataset.aos = 'fade'; // Set data-aos attribute

        const formatted_prompt = await formatText(prompt);
        const formatted_prompt_with_newlines = formatted_prompt.replace(/\n/g, '<br>');
        newUserDiv.innerHTML = `
            <i class="fa-solid fa-user"></i> You:
            <p>${formatted_prompt_with_newlines}</p>
        `;
        chatHistory.appendChild(newUserDiv);
        Prism.highlightAll();

        window.scrollTo({
            top: document.body.scrollHeight,
            behavior: 'smooth'
        });

        if (text_models.includes(model)) {
            messages.push({ "role": "user", "content": prompt });
        }

        const requestUrl = text_models.includes(model) ? 'https://api.xet.one/v1/chat/completions' : 'https://api.xet.one/v1/images/generations';
        // const requestUrl = text_models.includes(model) ? 'http://192.168.0.102:6750/v1/chat/completions': 'http://192.168.0.102:6750/v1/images/generations'
        const requestBody = text_models.includes(model)
            ? JSON.stringify({ model: model, messages: messages })
            : JSON.stringify({ model: model, prompt: prompt, size:size});

        document.getElementById('promptInput').value = ''; // Clear input after sending
        promptInput.style.height = '38px'; // Reset to default height
        const requestHeaders = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        };

        const response = await fetch(requestUrl, {
            method: 'POST',
            body: requestBody,
            headers: requestHeaders
        });

        if (!response.ok) {
            const responseText = await response.text();
            throw new Error(`Error: ${response.statusText}, ${responseText}`);
        }

        const responseData = await response.json();

        if (text_models.includes(model)) {
            let answer = responseData.choices[0].message.content;
            messages.push({ "role": "assistant", "content": answer });

            const newResponseDiv = document.createElement('div');
            newResponseDiv.className = 'text-response';
            newResponseDiv.dataset.aos = 'fade';

            const formatted_answer = await formatText(answer);
            newResponseDiv.innerHTML = `
                <i class="fa-duotone fa-solid fa-microchip-ai" style="font-size: 25px;"></i> AI:
                <p>${formatted_answer}</p>
            `;
            chatHistory.appendChild(newResponseDiv);
            Prism.highlightAll();
        }
        else {
            const newResponseDiv = document.createElement('div');
            newResponseDiv.className = 'image-response';
            newResponseDiv.dataset.aos = 'fade'; // Set data-aos attribute

            newResponseDiv.innerHTML = `
                <i class="fa-duotone fa-solid fa-microchip-ai" style="font-size: 25px;"></i> AI:
                <p>Here is your requested image: </p>
                <img src="${responseData.data[0].url}">
            `;
            chatHistory.appendChild(newResponseDiv);
        }

        window.scrollTo({
            top: document.body.scrollHeight,
            behavior: 'smooth'
        });

    } catch (error) {
        console.error(error);
        showError(error.message);
    } finally {
        setUIBusyState(false);
    }
}


document.addEventListener('click', function(e) {
    if (e.target.classList.contains('copy-btn')) {
        const codeBlock = e.target.nextElementSibling.innerText;
        
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(codeBlock).then(() => {
                e.target.textContent = 'Copied!';
                setTimeout(() => {
                    e.target.textContent = 'Copy';
                }, 5000);
            }).catch(err => {
                console.error('Failed to copy: ', err);
            });
        } else {
            // Fallback for non-secure contexts
            const tempTextArea = document.createElement('textarea');
            tempTextArea.value = codeBlock;
            document.body.appendChild(tempTextArea);
            tempTextArea.select();
            try {
                document.execCommand('copy');
                e.target.textContent = 'Copied!';
                setTimeout(() => {
                    e.target.textContent = 'Copy';
                }, 5000);
            } catch (err) {
                console.error('Failed to copy: ', err);
            }
            document.body.removeChild(tempTextArea);
        }
    }
});
