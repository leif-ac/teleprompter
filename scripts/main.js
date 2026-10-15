/**
 * @Bloco: PONTO DE ENTRADA PRINCIPAL (MAIN)
 * ---------------------------------
 * Este arquivo é carregado por último.
 * Ele inicializa o TinyMCE e renderiza o painel de configuração. ALém de adicionar params ddinamicamente
 */

//Adicionar dinamicamente params que faltam no CONFIG
Object.entries(config_data).forEach(([key, el]) => {
  this.CONFIG._config[key] = el.value + el.unidade;
})


// 1. Inicializa o Editor TinyMCE
tinymce.init({
  selector: `textarea#default-editor`, // Usa o ID do CONFIG
  //inline: true,
  license_key: 'gpl',
  plugins: [
    "advlist", "anchor", "autolink", "charmap", "code", "fullscreen",
    "image", "insertdatetime", "link", "lists", "media",
    "searchreplace", "table", "visualblocks",
  ],
  toolbar: "undo redo | styles | bold italic underline strikethrough | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image",
  skin: 'oxide-dark',
  promotion: false,
  height: '100%',
  menubar: 'file edit insert view format table tools | configCustom',
  content_css: "./css/tinyStyle.css",

  menu: {
    configCustom: {
      title: 'Teleprompter',
      items: 'toggleConfigMenu invertScreenMenu'
    }
  },

  setup: (editor) => {
    // Adiciona o botão "Abrir/Fechar Configuração" ao menu
    editor.ui.registry.addMenuItem('toggleConfigMenu', {
      text: "Abrir/Fechar Configuração",
      onAction: () => {
        // toggleButton é definido em sidebar.js
        const toggleButton = document.getElementById('toggleConfig');
        toggleButton.click();
      }
    });

    editor.on('keyup', (ev) => { //#burlarEscape
      if (ev.key == 'Escape' || ev.key == 'F11') {
        ev.preventDefault()
        toggleFullScreen()
      }
    })

    // Adiciona o botão "Inverter Tela" ao menu
    editor.ui.registry.addMenuItem('invertScreenMenu', {
      text: 'Inverter Tela',
      onAction: () => {
        const invertScreenButton = document.getElementById('fullScreen');
        invertScreenButton.click();
      }
    });

    // Evento que dispara APÓS o editor carregar
    editor.on('init', (ev) => {
      changeTextEditor(CONFIG.editors[0], 'FontSize', true, CONFIG._config.fontSize);
      altParamCss('margin', ['marginLeft', 'marginRight']);
    });

    // Evento que dispara QUANDO um "colar" começa
    editor.on('pastePreProcess', (ev) => {
      CONFIG.isPasting = true;

      //Evitar que forme uma tabela caso seja colada apenas UMA coluna
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = ev.content;

      const tables = tempDiv.querySelectorAll('table');

      if (tables.length > 0) {
        tables.forEach(table => {
          const firstRow = table.querySelector('tr');
          const cells = firstRow.querySelectorAll('td, th');
          let newContent = "";

          if (cells.length === 1) {

            table.querySelectorAll('tr').forEach(row => {
              const cell = row.querySelector('td, th');

              newContent += `<p>${cell.innerHTML}</p>`
            })
          } else {
            return
          };

          table.outerHTML = newContent

        });

        const paragraphs = tempDiv.querySelectorAll('p');

        paragraphs.forEach(p => {
          // 1. Obtém o texto puro
          // 2. Substitui o caractere especial &nbsp; (\u00a0) por espaço normal
          // 3. Remove espaços do início e fim (.trim())
          const textContent = p.textContent.replace(/\u00a0/g, ' ').trim();

          // Verifica se há mídia dentro (não queremos apagar um <p> que só tenha uma imagem)
          const hasMedia = p.querySelector('img, iframe, video, hr');

          // Se o texto for vazio E não tiver mídia, remove o elemento
          if (textContent === '' && !hasMedia) {
            p.remove();
          }
        });

        console.log(tempDiv)
        ev.content = tempDiv.innerHTML;
      }


    });

    // Evento que dispara DEPOIS da limpeza do TinyMCE, mas ANTES da inserção
    editor.on('pastePostProcess', (event) => {
      console.log('Limpando tabelas coladas...');
      const element = event.node;
      const tables = element.querySelectorAll("table");

      for (const table of tables) {
        table.style.width = '100%';
      }
    });

    // Evento que dispara DEPOIS de QUALQUER mudança no editor
    editor.on('change', () => {
      if (CONFIG.isPasting) {
        changeTextEditor(CONFIG.editors[0], 'FontSize', true, CONFIG._config.fontSize);
        CONFIG.isPasting = false;
      }
    });

    // Evento se mexer no scroll do mouse
    editor.on('wheel', (ev) => {
      if (CONFIG.fullScreen) return;

      const headerTextEditor = document.querySelector(".tox-editor-header");

      if (headerTextEditor.classList.value.includes('hidden')) {
        headerTextEditor.classList.remove('hidden')
      }
    })

    // O foco NUNCA vai ser no editor quando em tela cheia
    editor.on('mousedown click', (ev) => {
      if (CONFIG.fullScreen) {
        ev.preventDefault();
        ev.stopImmediatePropagation();
        window.focus();
      }
    })
  }
});


// 2. Renderiza o Painel de Configuração Dinâmico
// (Este código é executado assim que 'config-panel.js' é carregado)
document.addEventListener('DOMContentLoaded', async () => {
  const areaConfigs = document.querySelector("#configs");
  const areaButtons = document.querySelector('#button');

  if (areaConfigs) {
    // Loop que constrói os painéis e os adiciona à página
    // 'buttons_config_data' é definido em config-panel.js
    for (const [key, button] of Object.entries(config_data)) {
      button.id = key;
      // 'ConfigClass' é definida em config-panel.js
      const painel = new ConfigClass(button);
      areaConfigs.appendChild(painel.element);
    }
  }

  if (areaButtons) {
    for (const [key, button] of Object.entries(buttons_data)) {
      button.id = key;
      const painel = new ButtonClass(button);
      areaButtons.appendChild(painel.element)
    }
  }
});

/**@LISTENERS_GERAIS */
document.addEventListener('keydown', (ev) => {
  const key = ev.key;

  if (key.toLowerCase() == 'c' &&
    ev.target !== 'INPUT' &&
    ev.target.tagName !== 'TEXTAREA') {
    document.getElementById('toggleConfig').click()
  }

  if (!CONFIG._config.isScrolling && ['Home', 'End'].includes(key)) {
    const editor = tinymce.get(CONFIG.editors[0]);

    if (key == 'Home') editor.getWin().scrollTo(0, 0);
    if (key == 'End') editor.getWin().scrollTo(0, editor.getBody().scrollHeight);
  }
})

/**
 * @Bloco: AUTO-HIDE CURSOR
 * ---------------------------------
 * Esconde o mouse após 3 segundos de inatividade.
 * Verifica se o TinyMCE existe antes de tentar acessar o documento interno.
 */
const iniciarAutoHider = () => {
  // 1. Se 'tinymce' ainda não existe ou não tem editor ativo, espera e tenta de novo
  if (typeof tinymce === 'undefined' || !tinymce.activeEditor || !tinymce.activeEditor.getBody()) {
    setTimeout(iniciarAutoHider, 200);
    return;
  }

  // 2. Configurações
  const HIDE_DELAY = 2000; // 3 segundos
  let cursorTimer;

  const editor = tinymce.get(this.CONFIG.editors[0]);
  const editorDoc = editor.getDoc();   // Documento do editor
  const mainBody = document.body;

  function showIdleUi() {
    editorDoc.querySelector("html").classList.remove('hide-cursor');
    mainBody.classList.remove('idle-ui-hidden');
  }

  function hideIdleUi() {
    editorDoc.querySelector("html").classList.add('hide-cursor');
    mainBody.classList.add('idle-ui-hidden');
  }

  // 3. Função que reseta o timer
  function resetCursorTimer() {
    // Mostra cursor imediatamente
    showIdleUi();

    clearTimeout(cursorTimer);

    // Inicia contagem regressiva
    cursorTimer = setTimeout(() => {
      // Só esconde se estiver no Fullscreen (Modo TP)
      // (Acessa o CONFIG global com segurança)
      if (typeof CONFIG !== 'undefined' && CONFIG.fullScreen) {
        console.log("Inatividade. Escondendo cursor...");
        hideIdleUi();
      }
    }, HIDE_DELAY);
  }

  // 4. Anexa os ouvintes (Listeners)
  // Na janela principal
  window.addEventListener('mousemove', resetCursorTimer);

  // Dentro do editor
  if (editorDoc) {
    editorDoc.addEventListener('mousemove', resetCursorTimer);
  }

  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement) {
      clearTimeout(cursorTimer);
      showIdleUi();
      return;
    }

    resetCursorTimer();
  });

  console.log("Auto-hider do cursor iniciado!");
};

// Inicia o processo
iniciarAutoHider();

/*DEBUG PARA VER TECLA CLICADA*/

document.addEventListener('keydown', (ev) => {
  const key = ev.key;
  console.log(key, ev)
})
