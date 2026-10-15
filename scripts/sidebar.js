/**
 * @Bloco: ANIMAÇÃO DO MENU LATERAL
 * ---------------------------------
 * Controla o clique no botão de "hamburger" para esconder/mostrar o painel.
 * Aguarda o DOM estar pronto para anexar o listener.
 */
document.addEventListener('DOMContentLoaded', () => {
    const appContainer = document.getElementById('app');
    const header = document.getElementById('header');
    const toggleButton = document.getElementById('toggleConfig');

    if (toggleButton) {
        toggleButton.addEventListener('click', () => {
            const isExpanded = toggleButton.getAttribute('data-expanded') === "true";
            toggleButton.setAttribute('data-expanded', !isExpanded);
            appContainer.classList.toggle('config-hidden');
            header.classList.toggle('header-hidden');
        });
    }
});