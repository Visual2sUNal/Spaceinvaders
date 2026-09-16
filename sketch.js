let nave;
let balas = [];
let balasAlien = [];
let aliens = [];
let explosiones = [];

let direccionAliens = 1;
let velocidadAliens = 2;

let puntuacion = 0;
let vidas = 3;
let estado = "jugando";

function setup() {
  createCanvas(600, 400);
  iniciarNivel();
}

function iniciarNivel() {
  nave = new Nave();
  balas = [];
  balasAlien = [];
  aliens = [];
  explosiones = [];
  direccionAliens = 1;
  velocidadAliens = 2;

  for (let fila = 0; fila < 4; fila++) {
    for (let col = 0; col < 7; col++) {
      let x = width / 2 - 120 + col * 40;
      let y = 50 + fila * 40;
      aliens.push(new Alien(x, y, fila));
    }
  }
}

function reiniciar() {
  puntuacion = 0;
  vidas = 3;
  estado = "jugando";
  iniciarNivel();
}

function draw() {
  background(0);

  if (estado === "jugando") {
    dibujarJuego();
  } else if (estado === "gameOver") {
    dibujarGameOver();
  } else if (estado === "victoria") {
    dibujarVictoria();
  }

  dibujarHUD();
  dibujarExplosiones();
}

function dibujarJuego() {
  if (nave.invencible && frameCount % 6 < 3) {
    // parpadeo
  } else {
    nave.mostrar();
  }
  nave.mover();
  nave.actualizarInvencibilidad();

  if (frameCount % 50 === 0) {
    balas.push(new Bala(nave.x, nave.y - 25));
  }

  actualizarBalasJugador();
  actualizarBalasAlien();
  moverAliens();
  disparoAliens();

  if (aliens.length === 0) {
    estado = "victoria";
  }
}

function actualizarBalasJugador() {
  for (let i = balas.length - 1; i >= 0; i--) {
    let bala = balas[i];
    bala.mostrar();
    bala.mover();

    if (bala.y < 0) {
      balas.splice(i, 1);
      continue;
    }

    for (let j = aliens.length - 1; j >= 0; j--) {
      let alien = aliens[j];

      if (
        bala.x > alien.x - alien.r &&
        bala.x < alien.x + alien.r &&
        bala.y > alien.y - alien.r &&
        bala.y < alien.y + alien.r
      ) {
        puntuacion += alien.getPuntos();
        explosiones.push(new Explosion(alien.x, alien.y));
        aliens.splice(j, 1);
        balas.splice(i, 1);
        break;
      }
    }
  }
}

function actualizarBalasAlien() {
  for (let i = balasAlien.length - 1; i >= 0; i--) {
    let bala = balasAlien[i];
    bala.mostrar();
    bala.moverAbajo();

    if (bala.y > height) {
      balasAlien.splice(i, 1);
      continue;
    }

    if (nave.invencible) continue;

    if (
      bala.x > nave.x - 25 &&
      bala.x < nave.x + 25 &&
      bala.y > nave.y - 20 &&
      bala.y < nave.y + 15
    ) {
      muerteJugador();
      balasAlien.splice(i, 1);
    }
  }
}

function moverAliens() {
  let tocarBorde = false;

  for (let alien of aliens) {
    alien.mostrar();
    alien.mover(direccionAliens * velocidadAliens);

    if (alien.x > width - 15 || alien.x < 15) {
      tocarBorde = true;
    }

    if (alien.y + alien.r > nave.y - 20) {
      estado = "gameOver";
    }
  }

  if (tocarBorde) {
    direccionAliens *= -1;
    for (let alien of aliens) {
      alien.bajar();
    }
  }
}

function disparoAliens() {
  if (aliens.length === 0) return;

  let probabilidad = map(aliens.length, 1, 28, 0.03, 0.008);

  if (random() < probabilidad) {
    let alien = random(aliens);
    balasAlien.push(new BalaAlien(alien.x, alien.y + 15));
  }
}

function muerteJugador() {
  explosiones.push(new Explosion(nave.x, nave.y));
  vidas--;

  if (vidas <= 0) {
    estado = "gameOver";
  } else {
    nave.x = width / 2;
    nave.invencible = true;
    nave.tiempoInvencible = frameCount;
  }
}

function dibujarExplosiones() {
  for (let i = explosiones.length - 1; i >= 0; i--) {
    let explosion = explosiones[i];
    explosion.mostrar();
    explosion.actualizar();

    if (explosion.terminada()) {
      explosiones.splice(i, 1);
    }
  }
}

function dibujarHUD() {
  push();
  fill(255);
  textSize(14);
  textAlign(LEFT);
  text("SCORE: " + puntuacion, 10, 20);

  textAlign(RIGHT);
  text("VIDAS: " + vidas, width - 10, 20);

  for (let i = 0; i < vidas; i++) {
    fill(0, 255, 0);
    triangle(
      width - 80 - i * 22, 35,
      width - 90 - i * 22, 45,
      width - 70 - i * 22, 45
    );
  }
  pop();
}

function dibujarGameOver() {
  push();
  fill(0, 0, 0, 180);
  rect(0, 0, width, height);

  textAlign(CENTER, CENTER);
  fill(255, 0, 0);
  textSize(48);
  text("GAME OVER", width / 2, height / 2 - 30);

  fill(255);
  textSize(18);
  text("Puntuación: " + puntuacion, width / 2, height / 2 + 20);

  let parpadeo = sin(frameCount * 0.08) * 127 + 128;
  fill(255, 255, 255, parpadeo);
  textSize(14);
  text("Presiona ENTER para reiniciar", width / 2, height / 2 + 60);
  pop();
}

function dibujarVictoria() {
  nave.mostrar();

  push();
  fill(0, 0, 0, 150);
  rect(0, 0, width, height);

  textAlign(CENTER, CENTER);
  fill(0, 255, 0);
  textSize(48);
  text("¡VICTORIA!", width / 2, height / 2 - 30);

  fill(255);
  textSize(18);
  text("Puntuación: " + puntuacion, width / 2, height / 2 + 20);

  let parpadeo = sin(frameCount * 0.08) * 127 + 128;
  fill(255, 255, 255, parpadeo);
  textSize(14);
  text("Presiona ENTER para jugar de nuevo", width / 2, height / 2 + 60);
  pop();
}

function keyPressed() {
  if (estado === "gameOver" || estado === "victoria") {
    if (keyCode === ENTER) {
      reiniciar();
    }
  }
}


class Nave {
  constructor() {
    this.x = width / 2;
    this.y = height - 30;
    this.velocidad = 5;
    this.invencible = false;
    this.tiempoInvencible = 0;
  }

  mostrar() {
    fill(0, 255, 0);
    triangle(
      this.x, this.y - 20,
      this.x - 25, this.y + 15,
      this.x + 25, this.y + 15
    );

    fill(0, 200, 255);
    ellipse(this.x, this.y - 5, 15, 15);

    fill(0, 180, 0);
    triangle(
      this.x - 10, this.y + 5,
      this.x - 30, this.y + 15,
      this.x - 10, this.y + 15
    );
    triangle(
      this.x + 10, this.y + 5,
      this.x + 30, this.y + 15,
      this.x + 10, this.y + 15
    );

    fill(255, 150, 0);
    triangle(
      this.x - 7, this.y + 15,
      this.x + 7, this.y + 15,
      this.x, this.y + 30
    );
  }

  mover() {
    if (keyIsDown(LEFT_ARROW) && this.x > 30) {
      this.x -= this.velocidad;
    }
    if (keyIsDown(RIGHT_ARROW) && this.x < width - 30) {
      this.x += this.velocidad;
    }
  }

  actualizarInvencibilidad() {
    if (this.invencible && frameCount - this.tiempoInvencible > 90) {
      this.invencible = false;
    }
  }
}


class Alien {
  constructor(x, y, fila) {
    this.x = x;
    this.y = y;
    this.r = 12;
    this.tipo = fila;
    this.frame = 0;
  }

  mostrar() {
    push();
    rectMode(CENTER);
    noStroke();
    this.frame = floor(frameCount / 15) % 2;

    if (this.tipo === 0) {
      this.alienRojo();
    } else if (this.tipo === 1) {
      this.alienVerde();
    } else {
      this.alienAzul();
    }
    pop();
  }

  alienRojo() {
    let pixel = 3;
    fill(255, 0, 0);

    rect(this.x - 9, this.y - 6, pixel * 2, pixel * 2);
    rect(this.x - 3, this.y - 9, pixel * 2, pixel * 2);
    rect(this.x + 3, this.y - 6, pixel * 2, pixel * 2);

    rect(this.x - 9, this.y, pixel * 2, pixel * 2);
    rect(this.x - 3, this.y, pixel * 2, pixel * 2);
    rect(this.x + 3, this.y, pixel * 2, pixel * 2);

    rect(this.x - 12, this.y + 3, pixel * 2, pixel * 2);
    rect(this.x + 12, this.y + 3, pixel * 2, pixel * 2);

    if (this.frame === 0) {
      rect(this.x - 9, this.y + 9, pixel * 2, pixel * 2);
      rect(this.x + 9, this.y + 9, pixel * 2, pixel * 2);
    } else {
      rect(this.x - 12, this.y + 9, pixel * 2, pixel * 2);
      rect(this.x + 12, this.y + 9, pixel * 2, pixel * 2);
    }
  }

  alienVerde() {
    let pixel = 3;
    fill(0, 255, 0);

    rect(this.x - 9, this.y - 9, pixel * 2, pixel * 2);
    rect(this.x + 9, this.y - 9, pixel * 2, pixel * 2);

    rect(this.x - 6, this.y - 6, pixel * 2, pixel * 2);
    rect(this.x, this.y - 9, pixel * 2, pixel * 2);
    rect(this.x + 6, this.y - 6, pixel * 2, pixel * 2);

    rect(this.x - 9, this.y, pixel * 2, pixel * 2);
    rect(this.x - 3, this.y, pixel * 2, pixel * 2);
    rect(this.x + 3, this.y, pixel * 2, pixel * 2);
    rect(this.x + 9, this.y, pixel * 2, pixel * 2);

    rect(this.x - 12, this.y + 3, pixel * 2, pixel * 2);
    rect(this.x + 12, this.y + 3, pixel * 2, pixel * 2);

    if (this.frame === 0) {
      rect(this.x - 6, this.y + 9, pixel * 2, pixel * 2);
      rect(this.x + 6, this.y + 9, pixel * 2, pixel * 2);
    } else {
      rect(this.x - 9, this.y + 9, pixel * 2, pixel * 2);
      rect(this.x + 9, this.y + 9, pixel * 2, pixel * 2);
    }
  }

  alienAzul() {
    let pixel = 3;
    fill(50, 50, 255);

    rect(this.x - 9, this.y - 6, pixel * 2, pixel * 2);
    rect(this.x - 3, this.y - 9, pixel * 2, pixel * 2);
    rect(this.x + 3, this.y - 9, pixel * 2, pixel * 2);
    rect(this.x + 9, this.y - 6, pixel * 2, pixel * 2);

    rect(this.x - 12, this.y, pixel * 2, pixel * 2);
    rect(this.x - 6, this.y, pixel * 2, pixel * 2);
    rect(this.x, this.y, pixel * 2, pixel * 2);
    rect(this.x + 6, this.y, pixel * 2, pixel * 2);
    rect(this.x + 12, this.y, pixel * 2, pixel * 2);

    rect(this.x - 9, this.y + 6, pixel * 2, pixel * 2);
    rect(this.x - 3, this.y + 9, pixel * 2, pixel * 2);
    rect(this.x + 3, this.y + 9, pixel * 2, pixel * 2);
    rect(this.x + 9, this.y + 6, pixel * 2, pixel * 2);

    if (this.frame === 0) {
      rect(this.x - 9, this.y + 12, pixel * 2, pixel * 2);
      rect(this.x + 9, this.y + 12, pixel * 2, pixel * 2);
    } else {
      rect(this.x - 12, this.y + 12, pixel * 2, pixel * 2);
      rect(this.x + 12, this.y + 12, pixel * 2, pixel * 2);
    }
  }

  mover(vel) {
    this.x += vel;
  }

  bajar() {
    this.y += 5;
  }

  getPuntos() {
    if (this.tipo === 0) return 40;
    if (this.tipo === 1) return 20;
    return 10;
  }
}


class Bala {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.velocidad = 6;
  }

  mostrar() {
    fill(255, 255, 255);
    rectMode(CENTER);
    rect(this.x, this.y, 5, 10);
  }

  mover() {
    this.y -= this.velocidad;
  }
}


class BalaAlien {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.velocidad = 3;
  }

  mostrar() {
    fill(255, 50, 50);
    rectMode(CENTER);
    rect(this.x, this.y, 4, 10);
  }

  moverAbajo() {
    this.y += this.velocidad;
  }
}


class Explosion {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vida = 20;
    this.particulas = [];

    for (let i = 0; i < 20; i++) {
      this.particulas.push({
        x: this.x,
        y: this.y,
        vx: random(-3, 3),
        vy: random(-3, 3),
        tamano: random(3, 7)
      });
    }
  }

  mostrar() {
    for (let particula of this.particulas) {
      fill(255, random(80, 180), 0);
      ellipse(
        particula.x,
        particula.y,
        particula.tamano
      );
    }
  }

  actualizar() {
    for (let particula of this.particulas) {
      particula.x += particula.vx;
      particula.y += particula.vy;
    }
    this.vida--;
  }

  terminada() {
    return this.vida <= 0;
  }
}
