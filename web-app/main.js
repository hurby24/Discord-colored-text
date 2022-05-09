    const textarea = document.querySelector("#textarea");
    const copybtn = document.querySelector(".btn.copy");
    const clearBtn = document.querySelector('.g-btn');
    textarea.oninput = () => {
        const base = textarea.innerHTML.replace(/<(\/?(br|span|span class="ansi-[0-9]*"))>/g,"[$1]");
        if (base.includes("<") || base.includes(">")) textarea.innerHTML = base.replace(/<.*?>/g,"").replace(/[<>]/g,"").replace(/\[(\/?(br|span|span class="ansi-[0-9]*"))\]/g,"<$1>");
    };

    document.addEventListener('keydown', event => {
        if (event.key === 'Enter') {
            document.execCommand('insertLineBreak')
            event.preventDefault()
        }
    });
    

    clearBtn.addEventListener('click', function () {
        textarea.innerHTML = "";
    }, false);
    document.querySelectorAll(".style-button").forEach((btn) => {
        btn.onclick = () => {
            if (!btn.dataset.ansi) {
                textarea.innerText = textarea.innerText;
                return;
            }

            const selection = window.getSelection();
            const text = window.getSelection().toString();
            
            const span = document.createElement("span");
            span.innerText = text;
            span.classList.add(`ansi-${btn.dataset.ansi}`);

            const range = selection.getRangeAt(0);
            range.deleteContents();
            range.insertNode(span);

            range.selectNodeContents(span);
            selection.removeAllRanges();
            selection.addRange(range);
        };
    });

    function nodesToANSI(nodes, states) {
        let text = ""
        for (const node of nodes) {
            if (node.nodeType === 3) {
                text += node.textContent;
                continue;
            }
            if (node.nodeName === "BR") {
                text += "\n";
                continue;   
            }
            const ansiCode = +(node.className.split("-")[1]);
            const newState = Object.assign({}, states.at(-1));

            if (ansiCode < 30) newState.st = ansiCode;
            if (ansiCode >= 30 && ansiCode < 40) newState.fg = ansiCode;
            if (ansiCode >= 40) newState.bg = ansiCode;

            states.push(newState)
            text += `\x1b[${newState.st};${(ansiCode >= 40) ? newState.bg : newState.fg}m`;
            text += nodesToANSI(node.childNodes, states);
            states.pop()
            text += `\x1b[0m`;
            if (states.at(-1).fg !== 2) text += `\x1b[${states.at(-1).st};${states.at(-1).fg}m`;
            if (states.at(-1).bg !== 2) text += `\x1b[${states.at(-1).st};${states.at(-1).bg}m`;
        }
        return text;
    }

    let copyCount = 0;
    let copyTimeout = null;

    copybtn.onclick = () => {
        const toCopy = "```ansi\n" + nodesToANSI(textarea.childNodes, [{ fg: 2, bg: 2, st:2 }]) + "\n```";
        navigator.clipboard.writeText(toCopy).then(() => {
            if (copyTimeout) clearTimeout(copyTimeout);

            const funnyCopyMessages = copybtn.innerText = ["Copied!", "Double Copy!", "Triple Copy!", "Dominating!!", "Rampage!!", "Mega Copy!!", "Unstoppable!!", "Wicked Sick!!", "Monster Copy!!!", "GODLIKE!!!", "BEYOND GODLIKE!!!!", Array(16).fill(0).reduce(p => p + String.fromCharCode(Math.floor(Math.random() * 65535)),"")];

            copybtn.style.backgroundColor = (copyCount <= 8) ? "#0CDB7B" : "#ED4245";
            copybtn.innerText = funnyCopyMessages[copyCount];
            copyCount = Math.min(11, copyCount + 1);
            copyTimeout = setTimeout(() => {
                copyCount = 0;
                copybtn.style.backgroundColor = null;
                copybtn.innerText = "Copy colored text";
            }, 2000)

        }, (err) => {
            if (copyCount > 2) return;
            alert("Copying failed for some reason, let's try showing an alert, maybe you can copy it instead.");
            alert(toCopy);
        });
    }