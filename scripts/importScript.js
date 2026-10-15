document.addEventListener('DOMContentLoaded', () => {
    // === Btn Global ===
    const btnImport = document.querySelector("#import"); //Botão para abrir dialogo dos import

    // === Dialog ===
    const dialogImport = document.getElementById("dialog-import"); //O próprio Dialog
    const btnDialogFile = dialogImport.querySelector("#btn-choice-file"); //Botão dentro do dialogo para abrir um (ou mais) arquivo
    const btnDialogFolder = dialogImport.querySelector("#btn-choice-folder"); //Botão para abrir uma pasta
    const btnDialogClose = dialogImport.querySelector(".btn-dialog-close"); //Botão para fechar o dialogo

    // === Btn Import Hidden ===
    const btnFile = document.querySelector("#file-input"); //Botão de import File @hidden
    const btnFolder = document.querySelector("#folder-input"); //Botão de import Folder @hidden


    // 1. ABRIR DIALOG
    btnImport.addEventListener('click', (ev) => {
        ev.preventDefault();
        dialogImport.showModal();
        CONFIG.dialog.import = true;
    })

    const btnCols = [...document.querySelectorAll('.btn-chk[name="chk-col"]')];
    for (const element of btnCols) {
        element.querySelector('span').addEventListener('click', (ev) => {
            const input = element.querySelector('input');
            const boolean = !input.checked;

            btnCols.forEach(el => {
                el.querySelector('input').checked = false;
            });
            input.checked = boolean
        })

        element.querySelector('input').addEventListener('click', (ev) => {
            const input = element.querySelector('input');
            const boolean = input.checked;

            btnCols.forEach(el => {
                el.querySelector('input').checked = false;
            });
            input.checked = boolean
        })
    }

    /**--------------------------------------------- */
    // 2. BOTÕES DENTRO DO DIALOG
    // -- Fechar Dialog --
    btnDialogClose.addEventListener('click', (ev) => {
        ev.preventDefault();
        dialogImport.close();
        CONFIG.dialog.import = false;
    })

    // -- Executar Botão dentro do Dialog --
    // -- File --
    btnDialogFile.addEventListener('click', (ev) => {
        btnFile.click()
        dialogImport.close();
    })

    // -- Folder --
    btnDialogFolder.addEventListener('click', (ev) => {
        btnFolder.click();
        dialogImport.close()
    })

    /**--------------------------------------------- */
    // 3.LISTENER CHANGE QUANDO IMPORTA
    btnFile.addEventListener('change', (ev) => {
        console.log(ev.target.files);
        handleFileImport(ev);
    })

    btnFolder.addEventListener('change', (ev) => {
        console.log(ev.target.files);
        handleFileImport(ev);
    })


    //-----------------------------------------------------------
    //-----------------------------------------------------------
    //-----------------------------------------------------------
    // a) Listerners "keydown"
    document.addEventListener("keydown", (ev) => {
        const key = ev.key;

        if (dialogImport.open) {
            const key = ev.key;

            switch (key) {
                case ('ArrowRight'): {
                    btnDialogFolder.click();
                } break;

                case ('ArrowLeft'): {
                    btnDialogFile.click();
                } break;
            }

            return;
        }

        if (key == "i" && !document.fullscreen) {
            dialogImport.showModal();
            CONFIG.dialog.import = true;
        }
    })
})

/**
 * Função para lidar com o import
 * @param {Event} event Evento que foi acionado
 */
async function handleFileImport(event) {
    const dialogWait = document.getElementById('dialog-wait');
    dialogWait.showModal();

    try {
        const files = Array.from(event.target.files)
            .filter(file => shouldImportFile(file))
            .sort((fileA, fileB) => {
                const pathA = fileA.webkitRelativePath || fileA.name;
                const pathB = fileB.webkitRelativePath || fileB.name;

                return pathA.localeCompare(pathB, 'pt-BR', { numeric: true, sensitivity: 'base' });
            });
        const editor = tinymce.get(CONFIG.editors[0]);

        if (!files.length) return;

        editor.setContent("");

        const slideMode = document.querySelector('#slideMode');
        slideMode.dataset.active = 'true';

        const useLeftCol = this.document.getElementById('chk-col-left').checked;
        const useRightCol = this.document.getElementById('chk-col-right').checked;
        const isColumnMode = useLeftCol || useRightCol;

        for (let index = 0; index < files.length; index++) {
            const file = files[index];
            const nextFile = files[index + 1] || null;
            const extension = file.name.split('.').pop().toLowerCase();

            try {


                if (extension === 'docx') {
                    await importDocx(file, editor, isColumnMode, useLeftCol);
                }

                if (extension === 'pdf') {
                    await importPdf(file, editor, isColumnMode, useLeftCol);
                }

                if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(extension)) {
                    await importImage(file, editor);
                    slideMode.dataset.active = 'false';
                }

                await insertImportDivider(file, nextFile, editor);

            } catch (error) {
                console.error(`Erro ao importar ${file.name}:`, error)
            }

        };

        changeTextEditor(CONFIG.editors[0], 'FontSize', true, CONFIG._config.fontSize);
        editor.getWin().scrollTo(0, 0);
    } finally {
        const slideMode = document.querySelector('#slideMode');
        slideMode.click();
        dialogWait.close();
    }
}


async function importDocx(file, editor, isColumnMode = false, useLeftCol = false) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const arrayBuffer = e.target.result;

            mammoth.convertToHtml({ arrayBuffer: arrayBuffer })
                .then(result => {
                    let htmlContent = result.value;

                    // - Criar elemento HTML para manipular
                    const divElement = document.createElement('div');
                    divElement.innerHTML = htmlContent;
                    divElement.querySelectorAll('table').forEach(el => {
                        el.style.textAlign = 'center';
                    })

                    if (result.messages.length > 0) console.log(result.messages);

                    if (isColumnMode) {
                        const tables = [...divElement.querySelectorAll('table')];

                        for (const table of tables) {
                            const text = [];
                            // 1. Pega todas as linhas da tabela
                            const rows = table.querySelectorAll('tr');

                            for (const row of rows) {
                                // 2. Pega as células (th ou td) apenas da linha atual
                                const cells = row.querySelectorAll('th, td');

                                if (cells.length === 0) continue; // Linha vazia, ignora

                                // 3. Verifica se é uma célula dupla (colspan). 
                                // Se for, adicionamos ela ao texto pois geralmente é um cabeçalho de cena que serve para as duas colunas
                                if (cells.length === 1) {
                                    const cell = cells[0];
                                    const tag = cell.tagName.toLowerCase() === 'th' ? 'h3' : 'p';
                                    text.push(`<${tag}>${cell.textContent}</${tag}>`);
                                    continue; // Pula para a próxima linha
                                }

                                // 4. Se for uma linha normal com 2 colunas
                                if (cells.length >= 2) {
                                    // Se for esquerda pega o índice [0], se for direita pega o índice [1]
                                    const targetCell = useLeftCol ? cells[0] : cells[1];

                                    // Define se é <h3> (cabeçalho) ou <p> (corpo) baseado na tag original
                                    const tag = targetCell.tagName.toLowerCase() === 'th' ? 'h3' : 'p';
                                    text.push(`<${tag}>${targetCell.textContent}</${tag}>`);
                                }
                            }

                            // Substitui a tabela inteira pelo texto processado
                            table.outerHTML = text.join('');
                        }
                    }

                    console.log(divElement)
                    editor.insertContent(divElement.innerHTML);
                    resolve();
                }
                ).catch(err => reject(err));
        };

        reader.readAsArrayBuffer(file);

    })
}

async function importPdf(file, editor, isColumnMode = false, useLeftCol = false) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = async (e) => {
            try {
                const typedarray = new Uint8Array(e.target.result);
                const pdf = await pdfjsLib.getDocument(typedarray).promise;
                let fullHtml = "";

                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const viewport = page.getViewport({ scale: 1.5 }); // Escala maior melhora precisão
                    const textContent = await page.getTextContent();

                    // 1. Pré-processamento: Adiciona dados úteis aos itens
                    let items = textContent.items.map(item => {
                        return {
                            str: item.str,
                            x: item.transform[4], // Posição Horizontal
                            y: item.transform[5], // Posição Vertical
                            height: item.height || 10 // Altura aproximada da fonte
                        };
                    });

                    // 2. Filtro de Colunas (Lógica Matemática)
                    if (isColumnMode) {
                        const midPoint = viewport.width / 2;
                        items = items.filter(item => {
                            // A escala do viewport afeta o ponto médio, ajustamos a lógica:
                            // O transform[4] é cru, então comparamos com width cru da página
                            // Mas para simplificar, usamos a lógica relativa:

                            // Se a página tem 600 de largura (exemplo), o meio é 300.
                            // Mas precisamos da largura original do PDF, não do viewport escalado.
                            // O pdf.js viewport.width já considera a escala. Vamos usar view crua:
                            const rawWidth = viewport.width / 1.5;
                            const rawMid = rawWidth / 2;

                            if (useLeftCol) return item.x < rawMid;
                            return item.x >= rawMid;
                        });
                    }

                    // 3. Ordenação Visual (Cima para Baixo, Esquerda para Direita)
                    // PDF Y=0 é o rodapé. Então Maior Y = Topo.
                    items.sort((a, b) => {
                        const diffY = b.y - a.y;
                        // Se estiverem na mesma "linha" (pequena diferença de Y), ordena por X
                        if (Math.abs(diffY) < 5) {
                            return a.x - b.x;
                        }
                        return diffY; // Se não, quem tem maior Y vem primeiro
                    });

                    // 4. Reconstrução de Linhas
                    let pageHtml = "";
                    let lastY = null;
                    let currentLine = [];

                    items.forEach(item => {
                        if (lastY === null) lastY = item.y;

                        // Se a diferença de altura for grande (> 10px), é nova linha
                        if ((lastY - item.y) > 12) {
                            pageHtml += `<p>${currentLine.join(' ')}</p>`;
                            currentLine = [];
                        }

                        currentLine.push(item.str);
                        lastY = item.y;
                    });

                    // Adiciona a última linha que sobrou
                    if (currentLine.length > 0) {
                        pageHtml += `<p>${currentLine.join(' ')}</p>`;
                    }

                    // Adiciona quebra de página visual
                    fullHtml += pageHtml + "<hr>";
                }

                editor.insertContent(fullHtml);
                resolve();

            } catch (error) {
                console.error(error);
                reject(error);
            }
        };

        reader.onerror = (err) => reject(err);
        reader.readAsArrayBuffer(file);
    });
}

async function importImage(file, editor) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const base64String = e.target.result;

                const imgHtml = `
                    <div class="slide-container">
                        <img src="${base64String}" class="tp-slide-image" alt="Slide"></img>
                    </div>
                `;

                editor.insertContent(imgHtml);
                resolve();
            } catch (error) {
                reject(error)
            }
        };

        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);

        console.log(editor)
    })
}

function isImageExtension(extension) {
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(extension);
}

function isTextExtension(extension) {
    return ['docx', 'pdf'].includes(extension);
}

function getParentFolder(file) {
    const relativePath = file.webkitRelativePath || '';
    if (!relativePath.includes('/')) return '';

    const parts = relativePath.split('/');
    parts.pop();
    return parts.join('/');
}

function shouldImportFile(file) {
    const extension = file.name.split('.').pop().toLowerCase();
    if (!isTextExtension(extension) && !isImageExtension(extension)) return false;

    if (!CONFIG._config.excludeInvertedFolders) return true;

    const relativePath = file.webkitRelativePath || '';
    if (!relativePath) return true;

    return !relativePath
        .split('/')
        .some(part => part.toUpperCase() === 'INVERTIDAS');
}

function getTextDividerHtml() {
    return `
        <div class="import-divider import-divider-text">
            <p>-----------------------------------------</p>
            <p>-----------------------------------------</p>
            <p>-----------------------------------------</p>
            <p><strong>---- FINAL DA AULA ----</strong></p>
            <p>-----------------------------------------</p>
            <p>-----------------------------------------</p>
        </div>
    `;
}

function getImageDividerHtml() {
    return ``;
}

async function insertImportDivider(currentFile, nextFile, editor) {
    if (!nextFile) return;

    const currentExtension = currentFile.name.split('.').pop().toLowerCase();
    const nextExtension = nextFile.name.split('.').pop().toLowerCase();

    if (isTextExtension(currentExtension) && isTextExtension(nextExtension)) {
        editor.insertContent(getTextDividerHtml());
        return;
    }

    if (!isImageExtension(currentExtension) || !isImageExtension(nextExtension)) return;

    const currentFolder = getParentFolder(currentFile);
    const nextFolder = getParentFolder(nextFile);

    if (!currentFolder || currentFolder === nextFolder) return;

    editor.insertContent(getImageDividerHtml());
}
