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
let jefe = null;
let aliensEliminados = [];
let probReaparicionAliens = 0.02;
let ultimoSpawnAlienBoss = 0;

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
  jefe = null;
  aliensEliminados = [];
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

function activarJefe() {
  if (jefe || aliens.length > 0) return;
  jefe = new Jefe();
  ultimoSpawnAlienBoss = frameCount;
  estado = "jefe";
}

function manejarReaparicionAliens() {
  if (estado !== "jugando" || !jefe || aliensEliminados.length === 0) return;

  if (random() < probReaparicionAliens && aliens.length < 5) {
    let alienMuerto = random(aliensEliminados);
    aliens.push(new Alien(random(40, width - 40), -20, alienMuerto.tipo));
  }
}

function spawnearAliensDelJefe() {
  if (estado !== "jefe" || aliens.length >= 8) return;
  if (frameCount - ultimoSpawnAlienBoss < 600) return;

  ultimoSpawnAlienBoss = frameCount;

  for (let i = 0; i < 1; i++) {
    if (aliens.length >= 8) break;

    let posicion = encontrarPosicionAlienPequeno();
    if (!posicion) break;

    aliens.push(new AlienPequeno(posicion.x, posicion.y));
  }
}

function encontrarPosicionAlienPequeno() {
  for (let intento = 0; intento < 40; intento++) {
    let candidato = {
      x: random(50, width - 50),
      y: random(80, 160),
    };

    if (abs(candidato.x - nave.x) < 140) continue;

    let seSuperpone = aliens.some((alien) => {
      return dist(candidato.x, candidato.y, alien.x, alien.y) < 36;
    });

    if (!seSuperpone) return candidato;
  }

  return null;
}

function dibujarBarraVidaJefe() {
  if (!jefe) return;

  push();
  rectMode(CORNER);
  let anchoBarra = 220;
  let x = width / 2 - anchoBarra / 2;
  let y = 28;

  fill(40);
  rect(x, y, anchoBarra, 16);

  let vidaRelativa = constrain(jefe.vida / jefe.vidaMax, 0, 1);
  fill(255, 0, 80);
  rect(x, y, anchoBarra * vidaRelativa, 16);

  fill(255);
  textAlign(CENTER, CENTER);
  textSize(12);
  text("Jefe: " + jefe.vida + " / " + jefe.vidaMax, width / 2, y - 8);
  pop();
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
  } else if (estado === "jefe") {
    dibujarJefe();
  } else if (estado === "gameOver") {
    dibujarGameOver();
  } else if (estado === "victoria") {
    dibujarVictoria();
  }

  dibujarHUD();
  dibujarBarraVidaJefe();
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

  if (aliens.length === 0 && !jefe) {
    activarJefe();
  }
}

function dibujarJefe() {
  if (!jefe) {
    estado = "victoria";
    return;
  }

  jefe.mostrar();

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

  jefe.mover();
  jefe.disparar();
  spawnearAliensDelJefe();
  actualizarBalasJugador();
  actualizarBalasAlien();

  for (let alien of aliens) {
    alien.mostrar();
    alien.mover(direccionAliens * 0.7);

    if (alien.x > width - 15 || alien.x < 15) {
      direccionAliens *= -1;
    }

    if (alien.y > height - 20) {
      estado = "gameOver";
    }
  }

  if (jefe.vida <= 0) {
    puntuacion += 500;
    explosiones.push(new Explosion(jefe.x, jefe.y));
    jefe = null;
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

    let impactoAlien = false;

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
        aliensEliminados.push(alien);
        aliens.splice(j, 1);
        balas.splice(i, 1);
        impactoAlien = true;
        break;
      }
    }

    if (impactoAlien) continue;

    if (estado === "jefe" && jefe && aliens.length === 0) {
      if (
        bala.x > jefe.x - jefe.ancho / 2 &&
        bala.x < jefe.x + jefe.ancho / 2 &&
        bala.y > jefe.y - jefe.alto / 2 &&
        bala.y < jefe.y + jefe.alto / 2
      ) {
        jefe.vida -= 10;
        explosiones.push(new Explosion(bala.x, bala.y));
        balas.splice(i, 1);
      }
    }
  }
}

function actualizarBalasAlien() {
  for (let i = balasAlien.length - 1; i >= 0; i--) {
    let bala = balasAlien[i];
    bala.mostrar();

    if (bala instanceof BalaJefe) {
      bala.mover();
    } else {
      bala.moverAbajo();
    }

    if (
      bala.y > height + 20 ||
      bala.x < -20 ||
      bala.x > width + 20 ||
      bala.y < -20
    ) {
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
      width - 80 - i * 22,
      35,
      width - 90 - i * 22,
      45,
      width - 70 - i * 22,
      45,
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
      this.x,
      this.y - 20,
      this.x - 25,
      this.y + 15,
      this.x + 25,
      this.y + 15,
    );

    fill(0, 200, 255);
    ellipse(this.x, this.y - 5, 15, 15);

    fill(0, 180, 0);
    triangle(
      this.x - 10,
      this.y + 5,
      this.x - 30,
      this.y + 15,
      this.x - 10,
      this.y + 15,
    );
    triangle(
      this.x + 10,
      this.y + 5,
      this.x + 30,
      this.y + 15,
      this.x + 10,
      this.y + 15,
    );

    fill(255, 150, 0);
    triangle(
      this.x - 7,
      this.y + 15,
      this.x + 7,
      this.y + 15,
      this.x,
      this.y + 30,
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

class Jefe {
  constructor() {
    this.vidaMax = 120;
    this.vida = this.vidaMax;
    this.ancho = 110;
    this.alto = 52;
    this.x = width / 2;
    this.y = 58;
    this.velocidadX = 0.8;
    this.velocidadY = 0.6;
    this.direccionX = random() < 0.5 ? -1 : 1;
    this.direccionY = 1;
    this.tiempoDisparo = 0;
    this.tiempoInicio = frameCount;
    this.tiempoParaMover = floor(random(80, 150));
    this.cambioDireccion = frameCount;
  }

  mostrar() {
    push();
    rectMode(CENTER);
    noStroke();

    fill(255, 60, 120);
    rect(this.x, this.y, this.ancho, this.alto, 12);

    fill(25, 0, 40);
    rect(this.x, this.y + 8, this.ancho * 0.72, this.alto * 0.42, 9);

    fill(130, 220, 255);
    rect(this.x - 26, this.y - 8, 18, 14, 4);
    rect(this.x + 26, this.y - 8, 18, 14, 4);

    fill(255, 255, 255);
    rect(this.x - 24, this.y - 5, 8, 8, 2);
    rect(this.x + 24, this.y - 5, 8, 8, 2);

    fill(255, 180, 0);
    rect(this.x - 18, this.y + 10, 12, 10, 3);
    rect(this.x + 18, this.y + 10, 12, 10, 3);
    pop();
  }

  mover() {
    if (frameCount - this.tiempoInicio < this.tiempoParaMover) {
      this.x = width / 2;
      this.y = 58;
      return;
    }

    this.x += this.direccionX * this.velocidadX;
    this.y += this.direccionY * this.velocidadY;

    if (this.x < 80 || this.x > width - 80) {
      this.direccionX *= -1;
      this.x = constrain(this.x, 80, width - 80);
    }

    if (this.y < 55 || this.y > 145) {
      this.direccionY *= -1;
      this.y = constrain(this.y, 55, 145);
    }

    if (frameCount - this.cambioDireccion > 90) {
      this.direccionX = random() < 0.5 ? -1 : 1;
      this.direccionY = random() < 0.5 ? -1 : 1;
      this.cambioDireccion = frameCount;
    }
  }

  disparar() {
    if (frameCount - this.tiempoDisparo < 55) return;

    this.tiempoDisparo = frameCount;
    let direccionX = nave.x - this.x;
    let direccionY = nave.y - this.y;
    let longitud = sqrt(direccionX * direccionX + direccionY * direccionY) || 1;

    let vx = (direccionX / longitud) * 1.8;
    let vy = (direccionY / longitud) * 1.8;

    balasAlien.push(new BalaJefe(this.x, this.y + 10, vx, vy));
  }
}

class BalaJefe {
  constructor(x, y, vx, vy) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.velocidad = 3.2;
    this.tamano = 7;
  }

  mostrar() {
    fill(255, 150, 0);
    ellipse(this.x, this.y, this.tamano, this.tamano);
  }

  mover() {
    this.x += this.vx * this.velocidad;
    this.y += this.vy * this.velocidad;
  }
}

class AlienPequeno {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.r = 8;
    this.tipo = 3;
    this.frame = 0;
  }

  mostrar() {
    push();
    rectMode(CENTER);
    noStroke();
    this.frame = floor(frameCount / 15) % 2;
    fill(0, 255, 150);

    rect(this.x - 6, this.y - 3, 4, 4);
    rect(this.x, this.y - 6, 4, 4);
    rect(this.x + 6, this.y - 3, 4, 4);
    rect(this.x - 8, this.y + 2, 4, 4);
    rect(this.x + 8, this.y + 2, 4, 4);

    if (this.frame === 0) {
      rect(this.x - 6, this.y + 8, 4, 4);
      rect(this.x + 6, this.y + 8, 4, 4);
    } else {
      rect(this.x - 8, this.y + 8, 4, 4);
      rect(this.x + 8, this.y + 8, 4, 4);
    }
    pop();
  }

  mover(vel) {
    this.x += vel;
  }

  bajar() {
    this.y += 5;
  }

  getPuntos() {
    return 50;
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
        tamano: random(3, 7),
      });
    }
  }

  mostrar() {
    for (let particula of this.particulas) {
      fill(255, random(80, 180), 0);
      ellipse(particula.x, particula.y, particula.tamano);
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
