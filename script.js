/* ==========================================================
   CATALOGO – CuatroCancha Fc
   Los productos y sus imágenes se escriben en el HTML.
   Este archivo solo se encarga de: buscar, filtrar por
   categoría, ordenar y agregar al carrito.
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
})();

/* lo mas vendido */

(() => {
    "use strict";

    const contenedorMasVendidos = document.getElementById("mas-vendidos-lista");
    if (!contenedorMasVendidos) return;

    function obtenerProductosBase() {
        const tarjetasCatalogo = document.querySelectorAll("[data-producto]");
        const productos = [];

        tarjetasCatalogo.forEach((tarjeta) => {
            productos.push({
                id: Number(tarjeta.dataset.id),
                nombre: tarjeta.dataset.nombre,
                precio: Number(tarjeta.dataset.precio),
                imagen: tarjeta.querySelector("img") ? tarjeta.querySelector("img").getAttribute("src") : "",
                ventas: Number(localStorage.getItem(`ventas_prod_${tarjeta.dataset.id}`)) || 0
            });
        });

        return productos;
    }

    function renderizarMasVendidos() {
        const productos = obtenerProductosBase();
        productos.sort((a, b) => b.ventas - a.ventas);

        const topMasVendidos = productos.slice(0, 4);

        contenedorMasVendidos.innerHTML = "";

        topMasVendidos.forEach((prod, index) => {
            const itemHTML = `
                <div class="d-flex align-items-center justify-content-between p-3 bg-surface border border-secondary rounded" style="background-color: var(--bg-surface, #0E1210);">
                    <div class="d-flex align-items-center gap-3">
                        <span class="text-warning fw-bold fs-4">#${index + 1}</span>
                        <div>
                            <h4 class="text-light fs-6 mb-1">${prod.nombre}</h4>
                            <p class="text-secondary small mb-0">$ ${prod.precio.toLocaleString("es-CO")} <span class="badge bg-dark text-warning ms-2">Comprado: ${prod.ventas} veces</span></p>
                        </div>
                    </div>
                    <button type="button" class="btn btn-sm btn-neon-action px-3 py-2" data-agregar-top="${prod.id}">
                        <i class="bi bi-plus-lg"></i>
                    </button>
                </div>
            `;
            contenedorMasVendidos.insertAdjacentHTML("beforeend", itemHTML);
        });
    }
    document.addEventListener("carrito:actualizado", (evento) => {
        const carrito = evento.detail.carrito;
        
        carrito.forEach((item) => {
            let ventasActuales = Number(localStorage.getItem(`ventas_prod_${item.id}`)) || 0;
            localStorage.setItem(`ventas_prod_${item.id}`, item.cantidad);
        });

        renderizarMasVendidos();
    });

    contenedorMasVendidos.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-agregar-top]");
        if (!btn) return;
        const idProd = btn.dataset.agregarTop;
        
        const tarjetaOriginal = document.querySelector(`[data-producto][data-id="${idProd}"]`);
        if (tarjetaOriginal) {
            const botonCatalogo = tarjetaOriginal.querySelector("[data-agregar]");
            if (botonCatalogo) botonCatalogo.click();
        }
    });
    renderizarMasVendidos();
})();