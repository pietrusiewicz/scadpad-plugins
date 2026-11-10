/**
 * Przykład pluginu z dwoma punktami rozszerzenia: przycisk w pasku i własna
 * sekcja w panelu bocznym. Konwertuje wyrenderowaną siatkę do formatu OBJ.
 */
export default {
  id: 'eksport-obj',

  setup(ctx) {
    let triangles = 0;
    let lastExport = null;

    const section = ctx.ui.addPanelSection({
      title: 'Eksport OBJ',
      render() {
        const list = document.createElement('dl');
        list.className = 'stats';

        const rows = [
          ['Trójkąty', triangles ? triangles.toLocaleString('pl-PL') : '—'],
          ['Ostatni eksport', lastExport ?? '—'],
        ];

        for (const [label, value] of rows) {
          const row = document.createElement('div');
          const dt = document.createElement('dt');
          dt.textContent = label;
          const dd = document.createElement('dd');
          dd.textContent = value;
          row.append(dt, dd);
          list.append(row);
        }

        return list;
      },
    });

    const stopListening = ctx.model.afterRender((stats) => {
      triangles = stats.triangles;
      section.refresh();
    });

    const removeButton = ctx.ui.addToolbarButton({
      label: 'Pobierz OBJ',
      title: 'Zapisz ostatni render jako OBJ',
      onClick() {
        const positions = ctx.model.getPositions();
        if (!positions) {
          ctx.ui.setStatus('Najpierw wyrenderuj model.', 'error');
          return;
        }

        const lines = [];
        for (let i = 0; i < positions.length; i += 3) {
          lines.push(`v ${positions[i].toFixed(4)} ${positions[i + 1].toFixed(4)} ${positions[i + 2].toFixed(4)}`);
        }
        for (let i = 1; i <= positions.length / 3; i += 3) {
          lines.push(`f ${i} ${i + 1} ${i + 2}`);
        }

        const bytes = new TextEncoder().encode(lines.join('\n') + '\n');
        ctx.actions.download(bytes, 'model.obj', 'model/obj');

        lastExport = `${new Date().toLocaleTimeString('pl-PL')} · ${(bytes.length / 1024).toFixed(0)} kB`;
        section.refresh();
        ctx.ui.setStatus(`Zapisano OBJ (${(bytes.length / 1024).toFixed(0)} kB).`, 'ok');
      },
    });

    return () => {
      stopListening();
      removeButton();
      section.remove();
    };
  },
};
