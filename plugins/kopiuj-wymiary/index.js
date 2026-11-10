/**
 * Przykład pluginu: jeden przycisk w pasku narzędzi i odczyt statystyk modelu.
 * Pokazuje najprostszy możliwy kontrakt — setup(ctx) i nic więcej.
 */
export default {
  id: 'kopiuj-wymiary',

  setup(ctx) {
    const removeButton = ctx.ui.addToolbarButton({
      label: 'Kopiuj wymiary',
      title: 'Skopiuj wymiary, objętość i masę do schowka',
      async onClick() {
        const stats = ctx.model.getStats();
        if (!stats) {
          ctx.ui.setStatus('Najpierw wyrenderuj model.', 'error');
          return;
        }

        const size = stats.size.map((value) => value.toFixed(1)).join(' × ');
        const text = `${size} mm · ${stats.volume.toFixed(1)} cm³ · ${stats.mass.toFixed(1)} g PLA`;

        try {
          await navigator.clipboard.writeText(text);
          ctx.ui.setStatus(`Skopiowano: ${text}`, 'ok');
        } catch {
          ctx.ui.setStatus('Przeglądarka nie pozwoliła skopiować ze schowka.', 'error');
        }
      },
    });

    // Zwrócona funkcja jest wołana przy zatrzymaniu pluginów.
    return removeButton;
  },
};
