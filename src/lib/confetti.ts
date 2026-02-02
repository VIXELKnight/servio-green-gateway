import confetti from "canvas-confetti";

export function fireSuccessConfetti() {
  const defaults = {
    spread: 360,
    ticks: 50,
    gravity: 0,
    decay: 0.94,
    startVelocity: 30,
    colors: ["#FFE400", "#FFBD00", "#E89400", "#FFCA6C", "#FDFFB8"],
  };

  function shoot() {
    confetti({
      ...defaults,
      particleCount: 40,
      scalar: 1.2,
      shapes: ["star"],
    });

    confetti({
      ...defaults,
      particleCount: 10,
      scalar: 0.75,
      shapes: ["circle"],
    });
  }

  setTimeout(shoot, 0);
  setTimeout(shoot, 100);
  setTimeout(shoot, 200);
}

export function fireCheckoutConfetti() {
  const count = 200;
  const defaults = {
    origin: { y: 0.7 },
  };

  function fire(particleRatio: number, opts: confetti.Options) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio),
    });
  }

  fire(0.25, {
    spread: 26,
    startVelocity: 55,
    scalar: 0.8,
    colors: ["#22c55e", "#16a34a", "#15803d"],
  });
  fire(0.2, {
    spread: 60,
    scalar: 1.2,
    colors: ["#a855f7", "#9333ea", "#7c3aed"],
  });
  fire(0.35, {
    spread: 100,
    decay: 0.91,
    scalar: 0.8,
    colors: ["#3b82f6", "#2563eb", "#1d4ed8"],
  });
  fire(0.1, {
    spread: 120,
    startVelocity: 25,
    decay: 0.92,
    scalar: 1.2,
    colors: ["#f59e0b", "#d97706", "#b45309"],
  });
  fire(0.1, {
    spread: 120,
    startVelocity: 45,
    colors: ["#ec4899", "#db2777", "#be185d"],
  });
}
