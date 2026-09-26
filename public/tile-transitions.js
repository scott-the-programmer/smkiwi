(() => {
  const selector = '.tile-area .app-window:not([hidden])';
  let generation = 0;

  const rects = () => new Map(
    [...document.querySelectorAll(selector)].map(node => [
      node.dataset.windowId,
      { node, rect: node.getBoundingClientRect(), ghost: makeGhost(node) },
    ]),
  );

  const makeGhost = node => {
    const ghost = node.cloneNode(true);
    ghost.removeAttribute('id');
    ghost.querySelectorAll('[id]').forEach(child => child.removeAttribute('id'));
    ghost.querySelectorAll('[aria-live]').forEach(child => child.removeAttribute('aria-live'));
    ghost.setAttribute('aria-hidden', 'true');
    ghost.classList.add('tile-ghost');
    ghost.querySelectorAll('button, input, a, summary').forEach(control => control.tabIndex = -1);
    return ghost;
  };

  const play = (node, frames, options) => {
    node.classList.add('tile-moving');
    const animation = node.animate(frames, options);
    const done = () => node.classList.remove('tile-moving');
    animation.addEventListener('finish', done, { once: true });
    animation.addEventListener('cancel', done, { once: true });
    return animation;
  };

  window.beginTileTransition = () => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    document.querySelectorAll('.tile-moving').forEach(node => {
      node.getAnimations().forEach(animation => animation.cancel());
    });
    const before = rects();
    const token = ++generation;

    // Dioxus applies signal updates after the event handler. Two frames ensure
    // the new grid has been laid out before measuring its final positions.
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (token !== generation) return;

      const afterNodes = [...document.querySelectorAll(selector)];
      const remaining = new Set(before.keys());

      afterNodes.forEach(node => {
        const previous = before.get(node.dataset.windowId);
        if (!previous) {
          play(node, [
            { opacity: 0, transform: 'translateY(10px) scale(.97)' },
            { opacity: 1, transform: 'none' },
          ], { duration: 240, easing: 'cubic-bezier(.2,.8,.2,1)' });
          return;
        }

        remaining.delete(node.dataset.windowId);
        const next = node.getBoundingClientRect();
        const dx = previous.rect.left - next.left;
        const dy = previous.rect.top - next.top;
        const sx = next.width ? previous.rect.width / next.width : 1;
        const sy = next.height ? previous.rect.height / next.height : 1;
        if (Math.abs(dx) < 1 && Math.abs(dy) < 1 && Math.abs(sx - 1) < .01 && Math.abs(sy - 1) < .01) return;

        play(node, [
          { transformOrigin: 'top left', transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})` },
          { transformOrigin: 'top left', transform: 'none' },
        ], { duration: 320, easing: 'cubic-bezier(.2,.8,.2,1)' });
      });

      remaining.forEach(id => {
        const previous = before.get(id);
        const ghost = previous.ghost;
        Object.assign(ghost.style, {
          position: 'fixed',
          left: `${previous.rect.left}px`,
          top: `${previous.rect.top}px`,
          width: `${previous.rect.width}px`,
          height: `${previous.rect.height}px`,
          margin: '0',
        });
        document.body.appendChild(ghost);
        const animation = play(ghost, [
          { opacity: 1, transform: 'scale(1)' },
          { opacity: 0, transform: 'scale(.97)' },
        ], { duration: 180, easing: 'ease-out', fill: 'forwards' });
        animation.addEventListener('finish', () => ghost.remove(), { once: true });
        animation.addEventListener('cancel', () => ghost.remove(), { once: true });
      });
    }));
  };
})();
