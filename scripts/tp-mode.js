const eventClick = new Event('click', { bubbles: false });

/**
 * @Bloco: MODO TELEPROMPTER (TP)
 * ---------------------------------
 * Gerencia os botões de controle do modo TP (Tela Cheia, Cores, etc.)
 * e os listeners de teclado globais.
 */


// Função Helper para o Modo TP
/**
 * Função para alternar o modo Fullscreen do Navegador.
 */
function toggleFullScreen() {
    //console.log("2. Aqui está pedindo para abrir/fechar fullscreen")
    let fullScreenData = this.CONFIG.fullScreen;

    if (!fullScreenData) {
        document.documentElement.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
}

/**
 * 
 * @param {String} direction Direção do Roll
 * @param {Boolean} boolean Manter roll ou trocar?
 */
function setRollUiHidden(isHidden) {
    const headerTextEditor = document.querySelector(".tox-editor-header");
    const editorDoc = tinymce.get(this.CONFIG.editors[0]).getDoc();

    if (headerTextEditor) {
        headerTextEditor.classList.toggle('hidden', isHidden);
    }

    if (editorDoc) {
        editorDoc.querySelector("html").classList.toggle('hide-cursor', isHidden);
    }
}

function toggleScroling(direction, boolean = false) {
    const html = tinymce.get(this.CONFIG.editors[0]).getDoc().querySelector('html');
    const valueScroll = this.CONFIG._config.speedScrollDefault * this.CONFIG._config.scrollMultiplier;
    console.log(valueScroll)

    //console.log(direction) 
    const config = this.CONFIG._config;

    if (config.isScrolling && !boolean) {
        console.log('PARA')
        clearInterval(config.scrollValue);
        config.isScrolling = false
        setRollUiHidden(false);
    } else {
        if (direction == 'up') {
            html.scrollBy(0, - window.innerHeight / 3)
        } else {
            setRollUiHidden(true);

            config.scrollValue = setInterval(() => {
                html.scrollBy(0, valueScroll)
            }, 33)

            config.isScrolling = true;
        }
    }
}

// Listener global para o navegador (F11 ou Escape)
document.addEventListener("fullscreenchange", (event) => {
    const editor = tinymce.get(this.CONFIG.editors[0]);
    const editorAreaContainer = editor.contentAreaContainer;
    const editorBody = editor.getBody()
    const booleanFullScreen = document.fullscreen;

    //console.log("4. Ao mudar de tela isso daqui ocorre.")
    //console.log("CONFIG estava atualmente em:", this.CONFIG.fullScreen, ' e vai para: ', booleanFullScreen);
    this.CONFIG.fullScreen = booleanFullScreen
    editorBody.classList.toggle('fullscreen', booleanFullScreen);

    //Arrumar layout com gambiarra caso tenha pulado algum dos passsos Default
    const btn = document.getElementById('fullScreen');
    const boolean = btn.dataset.active == booleanFullScreen.toString()
    //console.log('Layout pode estar errado. No momento ClassList inclui "Active"?: ', btn.classList.value.includes('active'), '; data-active é: ', btn.dataset.active)

    editorAreaContainer.classList.toggle('INVERTSCREEN')
    console.log(editor)


    if (!boolean) {
        //console.log('ERRO DE LAYOUT [ ClassList: ', btn.classList.value, '; dataset: ', btn.dataset.active, ']; Fullscreen está: ', booleanFullScreen)

        if (booleanFullScreen) {
            btn.classList.add("active");
            btn.dataset.active = 'true'
        } else {
            btn.classList.remove("active");
            btn.dataset.active = 'false'
        }

        //console.log('PARA: [ ClassList: ', btn.classList.value, '; dataset: ', btn.dataset.active, ']')
    }

    if (booleanFullScreen) {
        editor.selection.collapse();
        editorBody.setAttribute('contenteditable', 'false');
        editorBody.blur();
    } else {
        editorBody.setAttribute('contenteditable', 'true');
        setRollUiHidden(false);

        const headerTextEditor = document.querySelector(".tox-editor-header");

        if (headerTextEditor.classList.value.includes('hidden')) {
            headerTextEditor.classList.remove('hidden')
        }
    }

    //Se fechar enquanto scrolling, irá parar scrolling
    if (this.CONFIG._config.isScrolling && !document.fullscreen) {
        toggleScroling()
    }
});


/**
 * @Bloco: LISTENERS GLOBAIS DE TECLADO
 * ---------------------------------
 * Captura eventos de teclado em qualquer lugar da página.
 */
document.addEventListener("keydown", (event) => {
    if (document.activeElement.tagName.toLowerCase() === 'input') return;
    const btnInvertScreen = document.getElementById("fullScreen");
    const key = event.key;
    //console.log(event)

    // Atalho F11 para entrar/sair da tela cheia
    if (key == "F11") {
        event.preventDefault();
        console.log('0. Evento Triggado pelo F11')
        btnInvertScreen.dispatchEvent(eventClick)
    }

    //Funcionalidade do TP
    const keyUp = ['PageUp', 'ArrowLeft', 'ArrowUp'];
    const keyDown = ['PageDown', 'ArrowDown', 'ArrowRight', ' '];
    if ([...keyUp, ...keyDown].includes(key)) {
        const direction = keyUp.includes(key) ? 'up' : 'down';
        if (!this.CONFIG.fullScreen) return;
        const editor = tinymce.get(this.CONFIG.editors[0]);
        const html = editor.getDoc().querySelector('html');

        event.preventDefault();


        const isSlideMode = document.querySelector('#slideMode').dataset.active === 'true';

        if (isSlideMode) {
            const hWindow = editor.getWin().innerHeight;

            if (direction === 'up') {
                html.scrollBy(0, - hWindow);
            } else {
                if (html.scrollTop + hWindow > html.scrollHeight - html.clientHeight + 5) return;
                html.scrollBy(0, hWindow);
            }

            return;
        }

        toggleScroling(direction)
    }
});


// Keyup para burlar limitações #burlarEscape
document.addEventListener('keyup', (event) => {
    const key = event.key;
    const dialogImport = document.getElementById("dialog-import");
    if (CONFIG.dialog.import && key == 'Escape') {
        dialogImport.querySelector(".btn-dialog-close").click();
        return
    }

    if (key == 'Escape') {
        //console.log("0. Evento Triggado pelo ESCAPE")
        toggleFullScreen()
    }
});
