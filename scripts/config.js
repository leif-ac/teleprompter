/**
 * @Bloco: ESTADO GLOBAL
 * ---------------------------------
 * Define a configuração central da aplicação.
 * Carregado primeiro para que 'this.CONFIG' (window.CONFIG)
 * esteja disponível para todos os outros scripts.
 */
console.log("Configurações Gerais", this);
this.CONFIG = {
    fullScreen: false,
    dialog: {
        import: false,
        wait: false
    },
    editors: [
        'default-editor' // ID do textarea principal
    ],
    _config: {
        isPasting: false, // Flag para saber se está copiando ou não
        isScrolling: false,
        speedScrollDefault: 2,
        scrollValue: 0,
        scrollIncrement: 0.5,
        excludeInvertedFolders: true,
        powerPoint: {
            _oldFont: 84
        }
    },
};
