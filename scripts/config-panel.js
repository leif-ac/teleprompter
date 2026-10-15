/**
 * @Bloco: RENDERIZAÇÃO DINÂMICA (Painel de Configuração)
 * ---------------------------------
 * Define as classes e funções responsáveis por construir
 * e gerenciar o painel de configurações.
 */

// Classe "Fábrica" para criar cada painel de configuração
/**@CLASS */
class ConfigClass {
    constructor(options) {
        this.label = options.label;
        this.id = options.id;
        this.hasInput = options.hasInput ?? false;
        this.value = options.value ?? "";
        this.unidade = options.unidade ?? "";
        this.hasButtons = options.hasButtons ?? false;
        this.instruction = options.instruction ?? "";
        this.cssStyle = options.cssStyle || null;
        this.nChange = options.nChange || 5;
        this.isLimited = options.isLimited || [null, null];
        this.unidade = options.unidade || "";
        this.shortkey = options.shortkey ?? null;
        this.actions = options._functions ?? {};
        this._function = this.actions.primary ?? null;

        this.element = this._render();
        this._activateListeners();

        //console.log('> Constructor ', this);
    }

    // Método "privado" para construir o HTML do painel
    _render() {

        const thisValue = this.value + this.unidade;

        const spanLabel = `<span>${this.label}</span>`;
        const divButtons = this.hasButtons ? `
       <div>
          <button data-action="minus">-</button>
          <button data-action="plus">+</button>
       </div>
     ` : "";
        const input = this.hasInput ?
            `<input id="${this.id}" class="onChange" type="number" placeholder="${thisValue}" data-unidade="${this.unidade}">`
            : `<input id="${this.id}" class="onChange" disabled type="number" placeholder="${thisValue}" data-unidade="${this.unidade}">`;
        const spanInstruction = this.instruction || "";

        const elementDOM = document.createElement("div");
        const elementAside = document.createElement("aside");
        const instructionpan = document.createElement("span");

        elementAside.dataset.param = this.id;
        elementDOM.classList.add("config");
        instructionpan.textContent = spanInstruction;
        elementAside.innerHTML = spanLabel + divButtons + input;

        elementDOM.appendChild(elementAside);
        elementDOM.appendChild(instructionpan);

        return elementDOM;
    }

    // Método "privado" para ativar os botões e inputs
    _activateListeners() {
        const btns = this.element.querySelectorAll('button');
        const inputs = this.element.querySelectorAll("input");

        for (const btn of btns) {
            if (this._function) { // Garante que a função existe
                btn.addEventListener('click', ev => { this._function.call(this, ev) });
            }
        }

        for (const input of inputs) {
            if (!input.classList.value.includes("onChange")) continue;
            input.addEventListener("change", ev => { this._function.call(this, ev) });
        }

        if (this.shortkey !== null) {
            for (const [keys, actionType, actionName] of this.shortkey) {
                document.addEventListener('keydown', (ev) => {
                    const currentKey = ev.key;
                    const isShift = ev.shiftKey;
                    const isCtrl = ev.ctrlKey;
                    const isAlt = ev.altKey;

                    const target = ev.target || ev.srcElement;
                    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

                    const isContinue = [];


                    if (keys.includes(currentKey)) {
                        isContinue.push(true);

                        if (keys.length == 1) {
                            if (!isShift && !isCtrl && !isAlt) { isContinue.push(true) } else { isContinue.push(false) };
                        } else {
                            if (keys.includes('shift')) { if (isShift) { isContinue.push(true) } else { isContinue.push(false) } };
                            if (keys.includes('alt')) { if (isAlt) { isContinue.push(true) } else { isContinue.push(false) } };
                            if (keys.includes('ctrl')) { if (isCtrl) { isContinue.push(true) } else { isContinue.push(false) } };
                        }

                        if (isCtrl) console.log(isContinue, this)
                        if (!isContinue.some(el => el == false)) { // É a shortcut correta
                            ev.preventDefault();

                            const targetFunction = actionName && this.actions[actionName]
                                ? this.actions[actionName]
                                : this.actions.primary;

                            if (targetFunction) {
                                const mockEvent = {
                                    originalEvent: ev,
                                    srcElement: {
                                        tagName: 'BUTTON',
                                        dataset: { action: actionType },
                                        value: null
                                    },
                                    target: {
                                        tagName: 'BUTTON',
                                        dataset: { action: actionType },
                                    },
                                };

                                targetFunction.call(this, mockEvent);
                            }
                        }
                    }
                })
            }
        }
    }
}

// Classe de modelo para botões de ação única (Ex: Inverter Cor).
// (Restaurada conforme solicitado).
class ButtonClass {
    constructor(options) {
        this.label = options.label;
        this.id = options.id;
        this.shortkey = options.shortkey || null; //Mesmo formato do ConfigClass
        this.defaultActive = options.defaultActive || false;
        this.labelActive = options.labelActive || null; //Nome que a função terá quando estiver ativada
        this.colorActive = options.colorActive || null; //Cor custom quando o botão for ativado
        this.groups = options.groups || null;
        this.isHidden = options.isHidden || false; // O botão por padrão fica escondido
        this._function = options._function;


        //Lógica de Inicialização (Vários Estados de Botão ou só ON/OFF)
        if (this.groups) {
            this.states = ['default', ...Object.keys(this.groups)];
            this.currentStateIndex = 0;

            this._injectGroupStyles()
        }

        this.element = this._render();
        this._activateListeners();

        if (this.defaultActive && !this.groups) {
            this.element.click();
        }

        //console.log(`ButtonClass > ${options.label}`, this)
    }

    _getShortkeyLabel() {
        if (!Array.isArray(this.shortkey) || this.shortkey.length === 0) return null;

        const [keys] = this.shortkey[0];
        if (!Array.isArray(keys)) return null;

        return keys
            .map(key => {
                if (key === 'ctrl') return 'CTRL';
                if (key === 'shift') return 'SHIFT';
                if (key === 'alt') return 'ALT';
                if (key === ' ') return 'SPACE';
                return key.toUpperCase();
            })
            .join('+');
    }

    _matchShortkey(event, keys) {
        const currentKey = event.key;
        const isShift = event.shiftKey;
        const isCtrl = event.ctrlKey;
        const isAlt = event.altKey;

        if (!keys.includes(currentKey)) return false;

        if (keys.length === 1) {
            return !isShift && !isCtrl && !isAlt;
        }

        if (keys.includes('shift') && !isShift) return false;
        if (keys.includes('ctrl') && !isCtrl) return false;
        if (keys.includes('alt') && !isAlt) return false;

        return true;
    }

    _injectGroupStyles() {
        let cssString = ``;

        for (const [key, group] of Object.entries(this.groups)) {
            const styleProps = Object.entries(group.style)
                .map(([prop, val]) => ` ${prop}: ${val} !important;`)
                .join('\n');

            cssString += `button.${key} {\n${styleProps}\n}\n`;
        }

        const styleElement = document.createElement('style');
        styleElement.id = `style-${this.id}`;
        styleElement.textContent = cssString;
        document.head.appendChild(styleElement)
    }

    /**
   * Helper (Novo): Lógica para botões de TOGGLE (Liga/Desliga)
   * Retorna o novo estado (true ou false)
   */
    _handleToggleClick() {
        const btn = this.element;

        const isActive = btn.dataset.active === 'true';
        const newState = !isActive;

        //Atualiza label (Se existir)
        if (this.labelActive) {
            const name = newState ? this.labelActive : this.label;
            const labelShortkey = this._getShortkeyLabel();
            btn.innerHTML = labelShortkey ? `${name} [${labelShortkey}]` : name;
        }

        //Atualiza Cor (se existir)
        if (this.colorActive) {
            btn.style.background = newState ? this.colorActive : '';
        } else {
            btn.classList.toggle('active')
        }

        btn.dataset.active = newState

        return newState
    }


    /**
   * Helper (Novo): Lógica para botões de CICLO (A -> B -> C -> A)
   * Retorna o novo estado (ex: 'default', 'whiteFont')
   */
    _handleCycleClick() {
        // 1. Remove o estilo anterior (se não for 'default)
        const previousStateKey = this.states[this.currentStateIndex];
        if (previousStateKey !== 'default') {
            this.element.classList.remove(previousStateKey);
        }

        // 2. Avança o índice
        this.currentStateIndex = (this.currentStateIndex + 1) % this.states.length;
        const newStateKey = this.states[this.currentStateIndex];

        // 3. Atualiza aparência
        let newLabel;
        if (newStateKey === 'default') {
            newLabel = this.label;
            this.element.classList.remove('active')
        } else {
            newLabel = this.groups[newStateKey].label;
            this.element.classList.add(newStateKey);
            this.element.classList.add('active');
        }

        // 4. Atualiza o texto do botão
        const labelShortkey = this._getShortkeyLabel();
        this.element.innerHTML = labelShortkey ? `${newLabel} [${labelShortkey}]` : newLabel;

        // 5. Atualiza o estado
        this.element.dataset.state = newStateKey;
        return newStateKey;
    }


    _activateListeners() {
        const btn = this.element;
        //console.log(this)

        btn.addEventListener('click', (event) => {
            let currentState;

            //Ativar o css style correspondente
            if (this.groups) {
                currentState = this._handleCycleClick();
            } else {
                currentState = this._handleToggleClick();
            }

            this._function(currentState)
        })


        //Adicionar um shortkey para o botão
        if (this.shortkey) {
            document.addEventListener("keydown", (event) => {
                const target = event.target || event.srcElement;
                if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

                for (const [keys] of this.shortkey) {
                    if (!this._matchShortkey(event, keys)) continue;

                    event.preventDefault();
                    event.stopPropagation();
                    event.stopImmediatePropagation();
                    this.element.click();
                    break;
                }
            }, true)
        }
    }

    _render() {
        const buttonElement = document.createElement('button');

        // Adiciona o atalho [Tecla] ao label, se existir
        const labelShortkey = this._getShortkeyLabel();
        const name = labelShortkey ? `${this.label} [${labelShortkey}]` : this.label;

        buttonElement.id = this.id;
        buttonElement.innerHTML = name;

        if (this.isHidden) {
            buttonElement.classList.add('hidden')
        }

        // Define o estado inicial
        if (this.groups) {
            buttonElement.dataset.state = 'default';
        } else {
            buttonElement.dataset.active = 'false';
        }

        return buttonElement;
    }
}

/**@DATA */
// "Receita" para todos os painéis de configuração
// O value aqui será utilizado no CONFIG
const config_data = {
    scrollMultiplier: {
        label: 'Velocidade de Scrolling',
        value: '1',
        nChange: 0.5,
        unidade: "",
        hasButtons: true,
        isLimited: [0.5, null],
        instruction: "Use '+', '-' ou numerais.",
        shortkey: [ // Array com Teclas, Array com o Type customizado, Função que será executada
            //[...@keysString], @actionString, @functionFunction
            [['+', '='], 'plus'],
            [['-'], 'minus'],
            [['1', '2', '3', '4', '5'], 'setValueScroll', 'setValueScroll']
        ],
        _functions: {
            primary(event) {
                updateValueConfig(event, this);
                updateInputVisuals(this.id);

                if (CONFIG._config.isScrolling) {
                    clearInterval(CONFIG._config.scrollValue);
                    toggleScroling('down', true)
                }
            },
            setValueScroll(event) {
                const key = event.originalEvent.key;

                switch (key) {
                    case '0': {
                        CONFIG._config.scrollMultiplier = 0.5
                    } break;
                    case '1': {
                        CONFIG._config.scrollMultiplier = 1
                    } break;
                    case '2': {
                        CONFIG._config.scrollMultiplier = 1.5
                    } break;
                    case '3': {
                        CONFIG._config.scrollMultiplier = 2
                    } break;
                    case '4': {
                        CONFIG._config.scrollMultiplier = 2.5
                    } break;
                    case '5': {
                        CONFIG._config.scrollMultiplier = 3
                    } break;
                    default: {
                        CONFIG._config.scrollMultiplier = 1
                    }
                }

                updateInputVisuals(this.id);

                if (CONFIG._config.isScrolling) {
                    clearInterval(CONFIG._config.scrollValue);
                    toggleScroling('down', true)
                }
            }
        }
    },
    fontSize: {
        label: "Fonte",
        value: 84,
        unidade: 'px',
        hasButtons: true,
        //instruction: 'Use CTRL "+" e CTRL "-"',
        shortkey: [
            //[['+', 'ctrl'], 'plus'],
            //[['-', 'ctrl'], 'minus'],
        ],
        _functions: {
            primary(event) {
                updateValueConfig(event, this);
                updateInputVisuals(this.id);

                altParamCss(this.id, ['font-size', 'line-height'], ['body', 'body *']);
            }
        }
    },
    margin: {
        label: "Margens",
        hasButtons: true,
        value: 140,
        hasInput: false,
        unidade: 'px',
        cssStyle: ['marginLeft', 'marginRight'],
        nChange: 5,
        isLimited: [0, null],
        _functions: {
            primary(event) {
                updateValueConfig(event, this);
                updateInputVisuals(this.id);
                altParamCss(this.id, ['margin-right', 'margin-left']);

                const editor = tinymce.get(CONFIG.editors[0]);
                const body = editor?.getBody();
                if (body) {
                    body.style.setProperty('--warning-margin-size', CONFIG._config.margin);
                }
            }
        }
    },
    leading: {
        label: "Espaçamento Linha",
        hasButtons: true,
        value: 40,
        unidade: 'px',
        _functions: {
            primary(event) {
                updateValueConfig(event, this);
                updateInputVisuals(this.id);
                altParamCss(this.id, ['line-height'], ['p']);
            }
        }
    },
    paragraphSpacing: {
        label: "Espaçamento Parágrafo",
        hasButtons: true,
        value: 0,
        unidade: 'px',
        _functions: {
            primary(event) {
                updateValueConfig(event, this);
                updateInputVisuals(this.id);
                altParamCss(this.id, ['margin-bottom'], ['p']);
            }
        }
    },
    imgWidthMin: {
        label: "Largura Min. Imagem",
        hasButtons: true,
        hasInput: true,
        value: 0,
        unidade: 'px',
        _functions: {
            primary(event) {
                updateValueConfig(event, this);
                updateInputVisuals(this.id);
                altParamCss(this.id, ['min-width', 'min-height'], ['body:not(.powerPoint) img']);
            }
        }
    },
    imgWidthMax: {
        label: "Largura Máx. Imagem",
        hasButtons: true,
        hasInput: true,
        value: 1920,
        unidade: 'px',
        _functions: {
            primary(event) {
                updateValueConfig(event, this);
                updateInputVisuals(this.id);
                altParamCss(this.id, ['max-width', 'max-height'], ['body:not(.powerPoint) img']);
            }
        }
    },
};

const buttons_data = {
    fullScreen: {
        label: 'Tela Cheia / inverter [F11/ESC]',
        //shortkey: "ESCAPE", Não funciona aqui, precisa ser feito manualmente no main.jsç pesquisar #burlarEscape
        _function: (el) => {
            //console.log( "1. Evento clique" )
            toggleFullScreen();
        }
    },
    readyRec: {
        label: 'Aviso Início da Gravação',
        colorActive: 'rgb(34 145 0)',
        shortkey: [
            [['alt', '1']]
        ],
        _function: (isActive) => {
            const overlay = document.getElementById('ready-overlay');
            if (!overlay) return;

            overlay.hidden = !Boolean(isActive);
        }
    },
    warningMode: {
        label: 'Aviso de Teste',
        colorActive: '#f59e0b',
        shortkey: [
            [['alt', '2']]
        ],
        _function: (isActive) => {
            const application = document.querySelector('[role="application"]');

            application.classList.toggle('warningTest', Boolean(isActive));
        }
    },
    error: {
        label: 'Aviso de Erro',
        shortkey: [
            [['alt', '3']]
        ],
        labelActive: 'Ocultar Aviso',
        colorActive: '#b91c1c',
        _function: (isActive) => {
            const overlay = document.getElementById('error-overlay');
            if (!overlay) return;

            overlay.hidden = !Boolean(isActive);
        }
    },
    fontColorMono: {
        label: 'Padronizar Cor da Fonte',
        groups: {
            whiteFont: {
                label: 'Fonte Branca',
                style: {
                    color: 'black',
                    background: 'white'
                }
            },
            blackFont: {
                label: 'Fonte Preta',
                style: {
                    color: 'white',
                    background: 'black'
                }
            }
        },
        _function: () => {
            const editor = tinymce.get(this.CONFIG.editors[0]);
            const body = editor.getBody();
            const mode = document.querySelector('#fontColorMono').dataset.state;


            body.classList.remove('whiteFont');
            body.classList.remove('blackFont');

            if (mode == 'whiteFont') {
                body.classList.add('whiteFont')
            }

            if (mode == 'blackFont') {
                body.classList.add('blackFont')
            }

            //console.log(mode)
            //console.log(body.classList)
        }
    },
    invert: {
        label: 'Inverter Cor',
        _function: () => {
            const editor = tinymce.get(this.CONFIG.editors[0]);
            const body = editor.getBody();

            body.classList.toggle('invertColor');
        }
    },
    slideMode: {
        label: 'Modo Power Point',
        _function: (el) => {

            //console.log(el)
            const editor = tinymce.get(this.CONFIG.editors[0]);
            const body = editor.getBody();
            const container = editor.container;
            const editorContainer = editor.editorContainer;

            const header = container.querySelector('.tox-editor-header');

            let oldFont = CONFIG._config.powerPoint._oldFont;

            if (el) {
                body.classList.add('powerPoint');
                editorContainer.classList.add('powerPointContainer');
                header.style.display = 'none';
                body.style.background = 'red';


                // Zerar Fonte para evitar espaço
                oldFont = parseFloat(CONFIG._config.fontSize);
                CONFIG._config.fontSize = '0px';
                document.querySelector('#fontSize').placeholder = '0px';


                body.querySelectorAll('p').forEach(el => {
                    el.style.display = 'none'
                });


            } else {
                body.classList.remove('powerPoint');
                editorContainer.classList.remove('powerPointContainer');
                header.style.display = '';
                body.style.background = '';

                // Voltar fonte antiga
                CONFIG._config.fontSize = oldFont + 'px';
                document.querySelector('#fontSize').placeholder = CONFIG._config.fontSize;

                body.querySelectorAll('p').forEach(el => {
                    el.style.display = ''
                });
            }
        }
    },
    toggleConfigPanel: {
        label: 'Abrir ou Fechar Configuração [C]',
        colorActive: "#1f2937",
        _function: (isActive) => {
            const toggleConfigDefault = document.querySelector("#toggleConfig");
            toggleConfigDefault.click();
        }
    },
    blockInvertidas: {
        label: 'Pasta Invertida Liberada',
        labelActive: 'Pasta Invertida Bloqueada',
        isHidden: true,
        colorActive: '#0f766e',
        defaultActive: true,
        _function: (isActive) => {
            CONFIG._config.excludeInvertedFolders = Boolean(isActive);
        }
    }
}

/**
 * @FUNCTIONS
 * @Bloco: FUNÇÕES HELPER (Auxiliares do Painel)
 * ---------------------------------
 */

/**
 * Função para fazer o cálculo e alterar o CONFIG
 * @param {*} event 
 * @param {*} it 
 * @returns 
 */
function updateValueConfig(event, it) {
    console.log('IT', it)
    // Params Default
    const paramGlobal = it.id;
    const unidade = it.unidade ?? '';
    const nChange = parseFloat(it.nChange) ?? 5;
    const isLimited = it.isLimited ?? [null, null];

    // Param Global
    let currentValue = parseFloat(this.CONFIG._config[paramGlobal]) || 0;
    let newValue = currentValue;

    // Input ou Button
    const element = event.srcElement;

    if (element.tagName == 'INPUT') {
        newValue = element.value;
    }


    if (element.tagName == 'BUTTON') {
        const action = element?.dataset.action;

        if (action === 'plus') newValue += nChange;
        if (action === 'minus') newValue -= nChange;
    }

    if (isLimited[0] !== null) newValue = Math.max(newValue, isLimited[0]);
    if (isLimited[1] !== null) newValue = Math.min(newValue, isLimited[1]);

    newValue += unidade;

    this.CONFIG._config[paramGlobal] = newValue;

    console.log({ paramGlobal, newValue })

    return newValue
}



/**
 * 2. VISUAL: Atualiza o Placeholder e limpa o Value
 * @param {String} inputId - ID do input HTML
 * @param {String} displayValue - O que vai aparecer no placeholder
 */
function updateInputVisuals(inputId) {
    const input = document.getElementById(inputId);
    const displayValue = CONFIG._config[inputId];
    if (input) {
        input.value = ""; // Limpa o campo digitável
        input.placeholder = displayValue; // Atualiza a "etiqueta"
    }
}

/**
 * 3. APLICAÇÃO CSS: Recebe o valor pronto e injeta no CSS/Style
 */
/**
 * 
 * @param {String} paramGlobal Parametro que contém o valor que deverá ser alterado
 * @param {Array} paramsStyle Estilos que serão alterados
 * @param {Array} elementHtml Identificadores de elementos html que terão seu paramStyle alterado
 * @returns 
 */
function altParamCss(paramGlobal, paramsStyle, elementsHTML) {
    const editor = tinymce.get(this.CONFIG.editors[0]);
    const value = CONFIG._config[paramGlobal];

    if (!elementsHTML) {
        // Aplica inline no body (ex: body { margin-left... })
        const bodyEditor = editor.getBody();
        for (const param of paramsStyle) {
            bodyEditor.style[param] = value;
        }
    } else {
        // Injeção de CSS global (ex: img { max-width... })
        let cssString = '';
        const styleId = `css-rule-${paramsStyle.join('-')}`;

        for (const element of elementsHTML) {
            const rules = paramsStyle.map(param => `${param}: ${value} !important;`);

            cssString += `${element} {
            ${paramsStyle.map(param => `${param}: ${value} !important;`).join(' ')}
         }\n`;
        };

        let styleTag = editor.dom.get(styleId);

        if (!styleTag) {
            styleTag = editor.dom.create('style', {
                id: styleId,
                type: 'text/css',
            });
            editor.dom.add(editor.getDoc().head, styleTag);
        }

        if (styleTag.styleSheet) {
            styleTag.styleSheet.cssText = cssString;
        } else {
            styleTag.textContent = cssString;
        }

        // recalcular palavras para não ocorrer quebra -> Mas não vi funcionando
        const body = editor.getBody();
        void body.offsetHeight;

        editor.nodeChanged();
    }
}

/**
 * 4. APLICAÇÃO TINY: Recebe o valor pronto e executa comando TinyMCE
 */
function altCssViaTiny(tinyCommand, param) {
    const selector = this.CONFIG.editors[0];
    const value = CONFIG._config[param];

    changeTextEditor(selector, tinyCommand, true, value);
}

/**
 * 5. HELPER TINY: Executa o comando (Mantido igual)
 */
function changeTextEditor(selector, paramChange, boolean = false, newValue) {
    const editor = tinymce.get(selector);
    if (!editor) return;

    editor.execCommand("SelectAll");
    editor.execCommand(paramChange, boolean, newValue);
    editor.selection.collapse(false);
}
