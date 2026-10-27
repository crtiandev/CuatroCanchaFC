(() => {
    "use strict";
 
    const CLAVE_CARRITO = "cuatrocancha_carrito";
    // Clave donde se guardan las ventas reales (solo se suman al finalizar una compra)
    const CLAVE_VENTAS = "cuatrocancha_ventas";
 
    /* ---------- 0. DATOS: ARRAY DE PRODUCTOS ---------- */
    // Cada producto es un objeto { id, categoria, nombre, precio, imagen, ventas }.
    // "ventas" es un dato de ejemplo que se usa para armar la sección "Más vendidos".
    // El orden del array es el orden de "Destacados".
    const PRODUCTOS = [
        // Producto 1
        { id: 1, categoria: "camisetas", nombre: "Camiseta local 2026", precio: 189900, imagen: "imgs/clocal..jpg", ventas: 128 },
        // Producto 2
        { id: 2, categoria: "camisetas", nombre: "Camiseta visitante 2026", precio: 189900, imagen: "imgs/cvisitante.jpg", ventas: 96 },
        // Producto 3
        { id: 3, categoria: "camisetas", nombre: "Camiseta retro 1998", precio: 159900, imagen: "imgs/Camisetaretro1998.jpg", ventas: 74 },
        // Producto 4
        { id: 4, categoria: "camisetas", nombre: "Camiseta de arquero", precio: 174900, imagen: "imgs/carquero.jpg", ventas: 51 },
        // Producto 5
        { id: 5, categoria: "guayos", nombre: "Guayos Velocidad Pro", precio: 399900, imagen: "imgs/guayos1.jpg", ventas: 143 },
        // Producto 6
        { id: 6, categoria: "guayos", nombre: "Guayos Control Elite", precio: 429900, imagen: "imgs/guayosrojos.jpg", ventas: 88 },
        // Producto 7
        { id: 7, categoria: "guayos", nombre: "Guayos Césped Sintético", precio: 259900, imagen: "imgs/guayos4.jpg", ventas: 112 },
        // Producto 8
        { id: 8, categoria: "guayos", nombre: "Guayos Sala Indoor", precio: 219900, imagen: "imgs/grojos.jpg", ventas: 67 },
        // Producto 9
        { id: 9, categoria: "accesorios", nombre: "Balón oficial de partido", precio: 149900, imagen: "imgs/balon.jpg", ventas: 156 },
        // Producto 10
        { id: 10, categoria: "accesorios", nombre: "Guantes de arquero", precio: 89900, imagen: "imgs/guantes.jpg", ventas: 79 },
        // Producto 11
        { id: 11, categoria: "accesorios", nombre: "Espinilleras ligeras", precio: 49900, imagen: "imgs/canilleras.jpg", ventas: 134 },
        // Producto 12
        { id: 12, categoria: "accesorios", nombre: "Morral deportivo", precio: 119900, imagen: "imgs/maletin.jpg", ventas: 93 }
    ];
 
    // Texto bonito de cada categoría para mostrarlo en la tarjeta
    const ETIQUETAS_CATEGORIA = {
        camisetas: "Camisetas",
        guayos: "Guayos",
        accesorios: "Accesorios"
    };
 
    // Cuántos productos se muestran en "Más vendidos"
    const CANTIDAD_MAS_VENDIDOS = 4;
 
    // Si la persona pidió menos movimiento en su sistema, se evitan las esperas de animación
    const prefiereMenosMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
 
    /* ---------- 1. ELEMENTOS ---------- */
    const grid = document.getElementById("catalogo-grid");
    if (!grid) return; // Si la sección no existe, no hace nada
 
    const gridMasVendidos = document.getElementById("masvendidos-grid");
    // Contenedor del ranking "Top Más Vendidos"
    const listaMasVendidos = document.getElementById("mas-vendidos-lista");
    const inputBuscar = document.getElementById("catalogo-buscar");
    const selectOrden = document.getElementById("catalogo-orden");
    const filtros = document.querySelectorAll(".filtro");
    const textoResultados = document.getElementById("catalogo-resultados");
    const bloqueVacio = document.getElementById("catalogo-vacio");
    const botonLimpiar = document.getElementById("catalogo-limpiar");
 
    // Elementos del panel del carrito
    const listaCarrito = document.getElementById("carrito-lista");
    const bloqueCarritoVacio = document.getElementById("carrito-vacio");
    const pieCarrito = document.getElementById("carrito-pie");
    const totalCarrito = document.getElementById("carrito-total");
    const mensajeCarrito = document.getElementById("carrito-mensaje");
    const botonVaciar = document.getElementById("carrito-vaciar");
    const botonFinalizar = document.getElementById("carrito-finalizar");
 
    /* ---------- 2. ESTADO ---------- */
    const estado = {
        categoria: "todos",
        busqueda: "",
        orden: "relevancia"
    };
 
    /* ---------- 3. UTILIDADES ---------- */
    // Quita tildes y pasa a minúsculas para que "cesped" encuentre "Césped"
    const normalizar = (texto) =>
        texto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
 
    // Convierte 189900 en "$ 189.900" (formato colombiano)
    const formatearPrecio = (valor) => `$ ${Number(valor).toLocaleString("es-CO")}`;
 
    // Evita que un texto guardado en localStorage se interprete como HTML
    const escaparHTML = (texto) =>
        String(texto)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
 
    /* ---------- 4. RENDER DINÁMICO DEL CATÁLOGO ---------- */
    // Devuelve el HTML de una tarjeta a partir de un objeto del array PRODUCTOS.
    // Mantiene los mismos data-* y clases que tenía el HTML escrito a mano.
    function crearTarjetaProducto(producto, esMasVendido = false) {
        const etiquetaVentas = esMasVendido
            ? `<p class="producto__ventas"><i class="bi bi-fire" aria-hidden="true"></i> ${producto.ventas} vendidos</p>`
            : "";
 
        return `
            <div class="col-12 col-sm-6 col-lg-3" data-producto data-id="${producto.id}" data-categoria="${producto.categoria}" data-nombre="${escaparHTML(producto.nombre)}" data-precio="${producto.precio}">
                <article class="producto">
                    <div class="producto__media">
                        <img src="${escaparHTML(producto.imagen)}" alt="${escaparHTML(producto.nombre)}" loading="lazy">
                    </div>
                    <p class="producto__categoria">${ETIQUETAS_CATEGORIA[producto.categoria]}</p>
                    <h3 class="producto__nombre">${escaparHTML(producto.nombre)}</h3>
                    ${etiquetaVentas}
                    <div class="producto__precios">
                        <span class="producto__precio">${formatearPrecio(producto.precio)}</span>
                    </div>
                    <button type="button" class="btn-catalogo" data-agregar>Agregar al carrito</button>
                </article>
            </div>`;
    }
 
    // Dibuja los 12 productos del array dentro del catálogo
    function renderizarCatalogo() {
        grid.innerHTML = PRODUCTOS.map((producto) => crearTarjetaProducto(producto)).join("");
    }
 
    // ----- Ventas reales (se guardan solo cuando se finaliza una compra) -----
    function leerVentas() {
        try {
            const guardado = JSON.parse(localStorage.getItem(CLAVE_VENTAS));
            // Si lo guardado no es un objeto (dato dañado), se empieza sin ventas reales
            return guardado && typeof guardado === "object" && !Array.isArray(guardado) ? guardado : {};
        } catch (error) {
            return {};
        }
    }
 
    function guardarVentas(ventas) {
        try {
            localStorage.setItem(CLAVE_VENTAS, JSON.stringify(ventas));
        } catch (error) {
            // Si el navegador bloquea el almacenamiento, la tienda sigue funcionando
        }
    }
 
    // Suma al acumulado las unidades de cada producto comprado
    function registrarVentas(carrito) {
        const ventas = leerVentas();
        carrito.forEach((item) => {
            ventas[item.id] = (Number(ventas[item.id]) || 0) + item.cantidad;
        });
        guardarVentas(ventas);
    }
 
    // Dibuja el ranking "Más vendidos": ventas base del array + ventas reales guardadas
    function renderizarMasVendidos() {
        if (!listaMasVendidos) return;
        const ventasGuardadas = leerVentas();
 
        const ranking = PRODUCTOS
            .map((producto) => ({
                ...producto,
                ventasTotales: producto.ventas + (Number(ventasGuardadas[producto.id]) || 0)
            }))
            .sort((a, b) => b.ventasTotales - a.ventasTotales)
            .slice(0, CANTIDAD_MAS_VENDIDOS);
 
        listaMasVendidos.innerHTML = "";
 
        ranking.forEach((prod, index) => {
            const itemHTML = `
                <div class="d-flex align-items-center justify-content-between p-3 bg-surface border border-secondary rounded" style="background-color: var(--bg-surface, #0E1210);">
                    <div class="d-flex align-items-center gap-3">
                        <span class="text-warning fw-bold fs-4">#${index + 1}</span>
                        <div>
                            <h4 class="text-light fs-6 mb-1">${escaparHTML(prod.nombre)}</h4>
                            <p class="text-secondary small mb-0">$ ${prod.precio.toLocaleString("es-CO")} <span class="badge bg-dark text-warning ms-2">Comprado: ${prod.ventasTotales} veces</span></p>
                        </div>
                    </div>
                    <button type="button" class="btn btn-sm btn-neon-action px-3 py-2" data-agregar-top="${prod.id}">
                        <i class="bi bi-plus-lg"></i>
                    </button>
                </div>
            `;
            listaMasVendidos.insertAdjacentHTML("beforeend", itemHTML);
        });
    }
 
    // Primero se dibuja el HTML y después se buscan las tarjetas
    renderizarCatalogo();
    renderizarMasVendidos();
 
    const tarjetas = Array.from(grid.querySelectorAll("[data-producto]"));
 
    // Guarda la posición original para poder volver a "Destacados"
    tarjetas.forEach((tarjeta, indice) => {
        tarjeta.dataset.orden = indice;
    });
 
    /* ---------- 5. FILTRAR Y ORDENAR ---------- */
    function aplicar() {
        const termino = normalizar(estado.busqueda.trim());
 
        // Ordenar (reubica las tarjetas en el DOM)
        const ordenadas = [...tarjetas].sort((a, b) => {
            switch (estado.orden) {
                case "precio-asc":
                    return Number(a.dataset.precio) - Number(b.dataset.precio);
                case "precio-desc":
                    return Number(b.dataset.precio) - Number(a.dataset.precio);
                case "nombre":
                    return a.dataset.nombre.localeCompare(b.dataset.nombre, "es");
                default:
                    return Number(a.dataset.orden) - Number(b.dataset.orden);
            }
        });
        ordenadas.forEach((tarjeta) => grid.appendChild(tarjeta));
 
        // Mostrar u ocultar según categoría y búsqueda
        let visibles = 0;
        tarjetas.forEach((tarjeta) => {
            const coincideCategoria =
                estado.categoria === "todos" || tarjeta.dataset.categoria === estado.categoria;
            const coincideBusqueda = normalizar(tarjeta.dataset.nombre).includes(termino);
            const mostrar = coincideCategoria && coincideBusqueda;
 
            tarjeta.hidden = !mostrar;
            if (mostrar) visibles++;
        });
 
        bloqueVacio.hidden = visibles > 0;
        textoResultados.textContent = visibles === 1 ? "1 producto" : `${visibles} productos`;
    }
 
    function marcarFiltro(categoria) {
        filtros.forEach((boton) => {
            const activo = boton.dataset.categoria === categoria;
            boton.classList.toggle("is-active", activo);
            boton.setAttribute("aria-pressed", activo);
        });
    }
 
    /* ---------- 6. IMÁGENES ---------- */
    // Si una imagen no carga (ruta mal escrita o archivo faltante),
    // se reemplaza por un ícono para que la tarjeta no quede rota.
    function imagenFallida(img) {
        const icono = document.createElement("i");
        icono.className = "bi bi-image producto__icono";
        icono.setAttribute("aria-hidden", "true");
        img.replaceWith(icono);
    }
 
    // Aplica la regla anterior a todas las imágenes de un contenedor
    // (se usa en el catálogo, en "Más vendidos" y en el carrito)
    function vincularImagenesFallidas(contenedor) {
        contenedor.querySelectorAll("img").forEach((img) => {
            img.addEventListener("error", () => imagenFallida(img), { once: true });
            if (img.complete && img.naturalWidth === 0) imagenFallida(img);
        });
    }
 
    vincularImagenesFallidas(grid);
    if (gridMasVendidos) vincularImagenesFallidas(gridMasVendidos);
 
    /* ---------- 7. CARRITO ---------- */
    function leerCarrito() {
        try {
            const guardado = JSON.parse(localStorage.getItem(CLAVE_CARRITO));
            // Si lo guardado no es una lista (dato dañado), se empieza con un carrito vacío
            return Array.isArray(guardado) ? guardado : [];
        } catch (error) {
            return [];
        }
    }
 
    function guardarCarrito(carrito) {
        try {
            localStorage.setItem(CLAVE_CARRITO, JSON.stringify(carrito));
        } catch (error) {
            // Si el navegador bloquea el almacenamiento, el catálogo sigue funcionando
        }
    }
 
    // Suma las cantidades de todos los productos del carrito
    function contarUnidades(carrito) {
        return carrito.reduce((suma, item) => suma + item.cantidad, 0);
    }
 
    // Suma precio x cantidad de todos los productos del carrito
    function calcularTotal(carrito) {
        return carrito.reduce((suma, item) => suma + item.precio * item.cantidad, 0);
    }
 
    // Actualiza cualquier elemento del header que tenga data-carrito-contador
    function actualizarContador() {
        const total = contarUnidades(leerCarrito());
        document.querySelectorAll("[data-carrito-contador]").forEach((el) => {
            el.textContent = total;
        });
    }
 
    // Pequeña animación (CSS) del contador cada vez que se agrega algo
    function animarContador() {
        if (prefiereMenosMovimiento) return;
        document.querySelectorAll("[data-carrito-contador]").forEach((el) => {
            el.classList.remove("is-bump");
            void el.offsetWidth; // reinicia la animación si se agrega varias veces seguidas
            el.classList.add("is-bump");
        });
    }
 
    // Guarda, actualiza el contador y avisa a las demás secciones.
    // Todas las acciones del carrito (agregar, eliminar, vaciar...) pasan por aquí.
    function guardarYNotificar(carrito) {
        guardarCarrito(carrito);
        actualizarContador();
 
        // Aviso para que otras secciones (carrito, más vendidos) puedan reaccionar
        document.dispatchEvent(new CustomEvent("carrito:actualizado", { detail: { carrito } }));
    }
 
    function agregarAlCarrito(tarjeta) {
        const id = Number(tarjeta.dataset.id);
        const imagen = tarjeta.querySelector(".producto__media img");
 
        const carrito = leerCarrito();
        const existente = carrito.find((item) => item.id === id);
 
        if (existente) {
            existente.cantidad += 1;
        } else {
            carrito.push({
                id,
                nombre: tarjeta.dataset.nombre,
                precio: Number(tarjeta.dataset.precio),
                imagen: imagen ? imagen.getAttribute("src") : "",
                cantidad: 1
            });
        }
 
        guardarYNotificar(carrito);
        animarContador();
    }
 
    // Elimina por completo un producto del carrito (con una pequeña animación de salida)
    function eliminarDelCarrito(id) {
        const quitar = () => guardarYNotificar(leerCarrito().filter((item) => item.id !== id));
        const fila = listaCarrito.querySelector(`[data-item-id="${id}"]`);
 
        if (fila && !prefiereMenosMovimiento) {
            fila.classList.add("is-saliendo");
            setTimeout(quitar, 250);
        } else {
            quitar();
        }
    }
 
    // Suma o resta unidades; si llega a 0, el producto se elimina
    function cambiarCantidad(id, diferencia) {
        const carrito = leerCarrito();
        const item = carrito.find((producto) => producto.id === id);
        if (!item) return;
 
        item.cantidad += diferencia;
        if (item.cantidad <= 0) {
            eliminarDelCarrito(id);
            return;
        }
        guardarYNotificar(carrito);
    }
 
    function vaciarCarrito() {
        guardarYNotificar([]);
    }
 
    // Simula la compra: suma las ventas al ranking, vacía el carrito y muestra un mensaje de confirmación
    function finalizarCompra() {
        const carrito = leerCarrito();
        if (carrito.length === 0) return;
 
        const total = formatearPrecio(calcularTotal(carrito));
        const unidades = contarUnidades(carrito);
 
        registrarVentas(carrito);   // Suma lo comprado al ranking de "Más vendidos"
        vaciarCarrito();
        renderizarMasVendidos();    // Redibuja "Más vendidos" al instante
 
        mensajeCarrito.textContent =
            `¡Gracias por tu compra! Registramos tu pedido de ${unidades} ` +
            `${unidades === 1 ? "producto" : "productos"} por ${total}.`;
        mensajeCarrito.hidden = false;
    }
 
    /* ---------- 8. VISTA DEL CARRITO ---------- */
    // Devuelve el HTML de una fila del carrito (los textos se escapan por seguridad)
    function crearItemCarrito(item) {
        const nombre = escaparHTML(item.nombre);
        return `
            <li class="carrito-item" data-item-id="${item.id}">
                <div class="carrito-item__media">
                    <img src="${escaparHTML(item.imagen)}" alt="${nombre}">
                </div>
                <div class="carrito-item__info">
                    <p class="carrito-item__nombre">${nombre}</p>
                    <p class="carrito-item__precio">${formatearPrecio(item.precio)} c/u</p>
                    <div class="carrito-item__cantidad" role="group" aria-label="Cantidad de ${nombre}">
                        <button type="button" class="carrito-item__boton" data-accion="restar" data-id="${item.id}" aria-label="Quitar una unidad de ${nombre}"><i class="bi bi-dash-lg" aria-hidden="true"></i></button>
                        <span class="carrito-item__unidades">${item.cantidad}</span>
                        <button type="button" class="carrito-item__boton" data-accion="sumar" data-id="${item.id}" aria-label="Agregar una unidad de ${nombre}"><i class="bi bi-plus-lg" aria-hidden="true"></i></button>
                    </div>
                </div>
                <div class="carrito-item__lado">
                    <p class="carrito-item__subtotal">${formatearPrecio(item.precio * item.cantidad)}</p>
                    <button type="button" class="carrito-item__eliminar" data-accion="eliminar" data-id="${item.id}" aria-label="Eliminar ${nombre} del carrito"><i class="bi bi-trash3" aria-hidden="true"></i></button>
                </div>
            </li>`;
    }
 
    // Vuelve a dibujar el panel completo a partir de lo que hay en localStorage
    function renderizarCarrito() {
        const carrito = leerCarrito();
        const estaVacio = carrito.length === 0;
 
        listaCarrito.innerHTML = carrito.map(crearItemCarrito).join("");
        vincularImagenesFallidas(listaCarrito);
 
        bloqueCarritoVacio.hidden = !estaVacio;
        pieCarrito.hidden = estaVacio;
        totalCarrito.textContent = formatearPrecio(calcularTotal(carrito));
 
        // El mensaje de "gracias" desaparece apenas se agrega un producto nuevo
        if (!estaVacio) mensajeCarrito.hidden = true;
    }
 
    /* ---------- 9. NAVEGACIÓN ---------- */
    // Marca en la navbar la sección que se está viendo (clase "active" + aria-current)
    function resaltarSeccionActiva() {
        const enlaces = document.querySelectorAll("[data-seccion]");
        if (!("IntersectionObserver" in window)) return;
 
        const observador = new IntersectionObserver((entradas) => {
            entradas.forEach((entrada) => {
                if (!entrada.isIntersecting) return;
                enlaces.forEach((enlace) => {
                    const activo = enlace.dataset.seccion === entrada.target.id;
                    enlace.classList.toggle("active", activo);
                    if (activo) {
                        enlace.setAttribute("aria-current", "true");
                    } else {
                        enlace.removeAttribute("aria-current");
                    }
                });
            });
        }, { rootMargin: "-40% 0px -55% 0px" });
 
        enlaces.forEach((enlace) => {
            const seccion = document.getElementById(enlace.dataset.seccion);
            if (seccion) observador.observe(seccion);
        });
    }
 
    /* ---------- 10. EVENTOS ---------- */
    function confirmarEnBoton(boton) {
        boton.textContent = "Agregado";
        boton.classList.add("is-agregado");
        setTimeout(() => {
            boton.textContent = "Agregar al carrito";
            boton.classList.remove("is-agregado");
        }, 1200);
    }
 
    filtros.forEach((boton) => {
        boton.addEventListener("click", () => {
            estado.categoria = boton.dataset.categoria;
            marcarFiltro(estado.categoria);
            aplicar();
        });
    });
 
    inputBuscar.addEventListener("input", () => {
        estado.busqueda = inputBuscar.value;
        aplicar();
    });
 
    selectOrden.addEventListener("change", () => {
        estado.orden = selectOrden.value;
        aplicar();
    });
 
    botonLimpiar.addEventListener("click", () => {
        estado.categoria = "todos";
        estado.busqueda = "";
        estado.orden = "relevancia";
        inputBuscar.value = "";
        selectOrden.value = "relevancia";
        marcarFiltro("todos");
        aplicar();
    });
 
    // Un solo listener para todos los botones "Agregar al carrito"
    // (funciona tanto en el catálogo como en "Más vendidos")
    document.addEventListener("click", (evento) => {
        const boton = evento.target.closest("[data-agregar]");
        if (!boton) return;
        agregarAlCarrito(boton.closest("[data-producto]"));
        confirmarEnBoton(boton);
    });
 
    // Botón "+" de la lista de Más vendidos: reutiliza el botón "Agregar al carrito" del catálogo
    if (listaMasVendidos) {
        listaMasVendidos.addEventListener("click", (evento) => {
            const boton = evento.target.closest("[data-agregar-top]");
            if (!boton) return;
 
            const tarjetaOriginal = grid.querySelector(`[data-producto][data-id="${boton.dataset.agregarTop}"]`);
            if (tarjetaOriginal) {
                const botonCatalogo = tarjetaOriginal.querySelector("[data-agregar]");
                if (botonCatalogo) botonCatalogo.click();
            }
        });
    }
 
    // Un solo listener para los botones de cada fila del carrito: sumar, restar y eliminar
    listaCarrito.addEventListener("click", (evento) => {
        const boton = evento.target.closest("[data-accion]");
        if (!boton) return;
 
        const id = Number(boton.dataset.id);
        switch (boton.dataset.accion) {
            case "sumar":
                cambiarCantidad(id, 1);
                break;
            case "restar":
                cambiarCantidad(id, -1);
                break;
            case "eliminar":
                eliminarDelCarrito(id);
                break;
        }
    });
 
    botonVaciar.addEventListener("click", vaciarCarrito);
    botonFinalizar.addEventListener("click", finalizarCompra);
 
    // Cada vez que el carrito cambia, el panel se vuelve a dibujar
    document.addEventListener("carrito:actualizado", renderizarCarrito);
 
    // Si el carrito cambia en otra pestaña, esta pestaña se sincroniza
    window.addEventListener("storage", (evento) => {
        if (evento.key !== CLAVE_CARRITO) return;
        actualizarContador();
        renderizarCarrito();
    });
 
    /* ---------- 11. INICIO ---------- */
    aplicar();
    actualizarContador();
    renderizarCarrito();
    resaltarSeccionActiva();
})();