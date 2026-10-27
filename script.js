/* ==========================================================
   CATALOGO – CuatroCancha Fc
   Los productos y sus imágenes se escriben en el HTML.
   Este archivo se encarga de: buscar, filtrar por
   categoría, ordenar, agregar al carrito y mostrar el panel.
   ========================================================== */

(() => {
    "use strict";

    const CLAVE_CARRITO = "cuatrocancha_carrito";

    /* ---------- 1. ELEMENTOS ---------- */
    const grid = document.getElementById("catalogo-grid");
    if (!grid) return; // Si la sección no existe, no hace nada

    const tarjetas = Array.from(grid.querySelectorAll("[data-producto]"));
    const inputBuscar = document.getElementById("catalogo-buscar");
    const selectOrden = document.getElementById("catalogo-orden");
    const filtros = document.querySelectorAll(".filtro");
    const textoResultados = document.getElementById("catalogo-resultados");
    const bloqueVacio = document.getElementById("catalogo-vacio");
    const botonLimpiar = document.getElementById("catalogo-limpiar");

    // Guarda la posición original para poder volver a "Destacados"
    tarjetas.forEach((tarjeta, indice) => {
        tarjeta.dataset.orden = indice;
    });

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

    /* ---------- 4. FILTRAR Y ORDENAR ---------- */
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

    /* ---------- 5. IMÁGENES ---------- */
    // Si una imagen no carga (ruta mal escrita o archivo faltante),
    // se reemplaza por un ícono para que la tarjeta no quede rota.
    function imagenFallida(img) {
        const icono = document.createElement("i");
        icono.className = "bi bi-image producto__icono";
        icono.setAttribute("aria-hidden", "true");
        img.replaceWith(icono);
    }

    grid.querySelectorAll(".producto__media img").forEach((img) => {
        img.addEventListener("error", () => imagenFallida(img), { once: true });
        if (img.complete && img.naturalWidth === 0) imagenFallida(img);
    });

    /* ---------- 6. CARRITO ---------- */
    function leerCarrito() {
        try {
            return JSON.parse(localStorage.getItem(CLAVE_CARRITO)) || [];
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

    // Actualiza cualquier elemento del header que tenga data-carrito-contador
    function actualizarContador() {
        const total = leerCarrito().reduce((suma, item) => suma + item.cantidad, 0);
        document.querySelectorAll("[data-carrito-contador]").forEach((el) => {
            el.textContent = total;
        });
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

        guardarCarrito(carrito);
        actualizarContador();

        // Aviso para que otras secciones (carrito, más vendidos) puedan reaccionar
        document.dispatchEvent(new CustomEvent("carrito:actualizado", { detail: { carrito } }));
    }

    function confirmarEnBoton(boton) {
        boton.textContent = "Agregado";
        boton.classList.add("is-agregado");
        setTimeout(() => {
            boton.textContent = "Agregar al carrito";
            boton.classList.remove("is-agregado");
        }, 1200);
    }

    /* ---------- 6B. PANEL DEL CARRITO ---------- */
    const panelLista = document.getElementById("carrito-lista");
    const panelVacio = document.getElementById("carrito-vacio");
    const panelTotal = document.getElementById("carrito-total");
    const panelPie = document.querySelector(".carrito__pie");

    const formatoPrecio = (n) => "$ " + Number(n).toLocaleString("es-CO");
    const escapar = (s) =>
        String(s).replace(/[&<>"']/g, (c) =>
            ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

    function renderPanel() {
        if (!panelLista) return;
        const carrito = leerCarrito();
        const total = carrito.reduce((t, p) => t + p.precio * p.cantidad, 0);

        panelVacio.hidden = carrito.length > 0;
        panelPie.hidden = carrito.length === 0;
        panelTotal.textContent = formatoPrecio(total);

        panelLista.innerHTML = carrito.map((p) => `
          <li class="carrito__item" data-id="${p.id}">
            ${p.imagen ? `<img src="${escapar(p.imagen)}" alt="${escapar(p.nombre)}">` : ""}
            <div class="carrito__info">
              <p class="carrito__nombre">${escapar(p.nombre)}</p>
              <p class="carrito__precio">${formatoPrecio(p.precio * p.cantidad)}</p>
              <div class="carrito__cantidad">
                <button type="button" data-accion="restar" aria-label="Restar una unidad">−</button>
                <span>${p.cantidad}</span>
                <button type="button" data-accion="sumar" aria-label="Sumar una unidad">+</button>
              </div>
            </div>
            <button type="button" class="carrito__quitar" data-accion="quitar" aria-label="Quitar ${escapar(p.nombre)}">
              <i class="bi bi-trash"></i>
            </button>
          </li>`).join("");
    }

    function cambiarCarrito(carrito) {
        guardarCarrito(carrito);
        actualizarContador();
        renderPanel();
    }

    if (panelLista) {
        panelLista.addEventListener("click", (e) => {
            const btn = e.target.closest("[data-accion]");
            if (!btn) return;
            const id = Number(btn.closest("[data-id]").dataset.id);
            let carrito = leerCarrito();
            const item = carrito.find((p) => p.id === id);
            if (!item) return;

            if (btn.dataset.accion === "sumar") item.cantidad++;
            if (btn.dataset.accion === "restar") item.cantidad--;
            if (btn.dataset.accion === "quitar" || item.cantidad <= 0) {
                carrito = carrito.filter((p) => p.id !== id);
            }
            cambiarCarrito(carrito);
        });

        document.getElementById("carrito-vaciar").addEventListener("click", () => cambiarCarrito([]));

        document.getElementById("carrito-pagar").addEventListener("click", () => {
            alert("¡Gracias por tu compra! (aquí conectas tu pasarela de pago)");
        });

        // Cuando se agrega un producto desde el catálogo, se redibuja el panel
        document.addEventListener("carrito:actualizado", renderPanel);

        // Si abres la tienda en otra pestaña, se mantiene sincronizado
        window.addEventListener("storage", (e) => {
            if (e.key === CLAVE_CARRITO) { actualizarContador(); renderPanel(); }
        });
    }

    /* ---------- 7. EVENTOS ---------- */
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
    grid.addEventListener("click", (evento) => {
        const boton = evento.target.closest("[data-agregar]");
        if (!boton) return;
        agregarAlCarrito(boton.closest("[data-producto]"));
        confirmarEnBoton(boton);
    });

    /* ---------- 8. INICIO ---------- */
    aplicar();
    actualizarContador();
    renderPanel();
})();