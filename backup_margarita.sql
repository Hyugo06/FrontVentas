--
-- PostgreSQL database dump
--

\restrict 1CoskJwYHafh9qY08RoNPznMG6iXghndiE7gaT3mQ3YOTlxF5bWXIkns1jhsaYg

-- Dumped from database version 18.0
-- Dumped by pg_dump version 18.0

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE ONLY public.productos DROP CONSTRAINT fks3ykp9acfeoc2l7qmnodyhn1f;
ALTER TABLE ONLY public.producto_variantes DROP CONSTRAINT fkq7ega29yp2m3irjvvrfrwsq6i;
ALTER TABLE ONLY public.ventas DROP CONSTRAINT fkngvsjlvvv240ohesoj9e87s3h;
ALTER TABLE ONLY public.inventario_sucursal DROP CONSTRAINT fkn1javdhfp7no68us41v6ib4sd;
ALTER TABLE ONLY public.imagenes_producto DROP CONSTRAINT fkmlw1jk3iwkgb04aea290rp09x;
ALTER TABLE ONLY public.ventas DROP CONSTRAINT fkleerof1mym3gc1ah8hsarel3f;
ALTER TABLE ONLY public.inventario_sucursal DROP CONSTRAINT fkko2j7bpx7qs3hch4dw7mwq9gv;
ALTER TABLE ONLY public.cajas DROP CONSTRAINT fkkal46lhycb4457wk2b7r9gb80;
ALTER TABLE ONLY public.movimientos DROP CONSTRAINT fkggso8fbp0cpimqjskv15qu917;
ALTER TABLE ONLY public.detalle_venta DROP CONSTRAINT fkgds50vmwbs8lxoti80iekstyi;
ALTER TABLE ONLY public.detalle_venta DROP CONSTRAINT fke92fd2auy9ms2pvac9b4n8ttq;
ALTER TABLE ONLY public.productos DROP CONSTRAINT fkdtoa37luoxhhvbicrfiu5ygbj;
ALTER TABLE ONLY public.productos DROP CONSTRAINT fkc1mrc7r89nch4xtol227kdwce;
ALTER TABLE ONLY public.categorias DROP CONSTRAINT fkbt5pdc52jh54l2o97ic983j26;
ALTER TABLE ONLY public.ventas DROP CONSTRAINT fk9mbivrllsn9jffa05x77l5mc1;
ALTER TABLE ONLY public.imagenes_producto DROP CONSTRAINT fk9bgwqaobnsa1muydxwo18en5r;
ALTER TABLE ONLY public.productos DROP CONSTRAINT fk4npgwl82bnp4qwmi05mhi4ghi;
ALTER TABLE ONLY public.detalle_venta DROP CONSTRAINT fk2ens3kcdecgap5og51rbsp1h0;
ALTER TABLE ONLY public.ventas DROP CONSTRAINT ventas_pkey;
ALTER TABLE ONLY public.usuarios DROP CONSTRAINT usuarios_pkey;
ALTER TABLE ONLY public.usuarios DROP CONSTRAINT usuarios_nombre_usuario_key;
ALTER TABLE ONLY public.sucursal DROP CONSTRAINT ukoo3ck5046t6g7t2o87h3r0qjr;
ALTER TABLE ONLY public.sucursales DROP CONSTRAINT uk8bv0gcsxqwmc5r68oriq9l759;
ALTER TABLE ONLY public.sucursales DROP CONSTRAINT sucursales_pkey;
ALTER TABLE ONLY public.sucursal DROP CONSTRAINT sucursal_pkey;
ALTER TABLE ONLY public.productos DROP CONSTRAINT productos_pkey;
ALTER TABLE ONLY public.productos DROP CONSTRAINT productos_codigo_sku_key;
ALTER TABLE ONLY public.producto_variantes DROP CONSTRAINT producto_variantes_pkey;
ALTER TABLE ONLY public.movimientos DROP CONSTRAINT movimientos_pkey;
ALTER TABLE ONLY public.marcas DROP CONSTRAINT marcas_pkey;
ALTER TABLE ONLY public.marcas DROP CONSTRAINT marcas_nombre_key;
ALTER TABLE ONLY public.inventario_sucursal DROP CONSTRAINT inventario_sucursal_pkey;
ALTER TABLE ONLY public.imagenes_producto DROP CONSTRAINT imagenes_producto_pkey;
ALTER TABLE ONLY public.detalle_venta DROP CONSTRAINT detalle_venta_pkey;
ALTER TABLE ONLY public.cupones DROP CONSTRAINT cupones_pkey;
ALTER TABLE ONLY public.cupones DROP CONSTRAINT cupones_codigo_key;
ALTER TABLE ONLY public.clientes DROP CONSTRAINT clientes_pkey;
ALTER TABLE ONLY public.clientes DROP CONSTRAINT clientes_email_key;
ALTER TABLE ONLY public.clientes DROP CONSTRAINT clientes_dni_key;
ALTER TABLE ONLY public.categorias DROP CONSTRAINT categorias_pkey;
ALTER TABLE ONLY public.cajas DROP CONSTRAINT cajas_pkey;
DROP TABLE public.ventas;
DROP TABLE public.usuarios;
DROP TABLE public.sucursales;
DROP TABLE public.sucursal;
DROP TABLE public.productos;
DROP TABLE public.producto_variantes;
DROP TABLE public.movimientos;
DROP TABLE public.marcas;
DROP TABLE public.inventario_sucursal;
DROP TABLE public.imagenes_producto;
DROP TABLE public.detalle_venta;
DROP TABLE public.cupones;
DROP TABLE public.clientes;
DROP TABLE public.categorias;
DROP TABLE public.cajas;
DROP FUNCTION public.actualizar_total_venta_trigger();
DROP FUNCTION public.actualizar_stock_trigger();
-- *not* dropping schema, since initdb creates it
--
-- Name: public; Type: SCHEMA; Schema: -; Owner: margarita_user
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO margarita_user;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: margarita_user
--

COMMENT ON SCHEMA public IS '';


--
-- Name: actualizar_stock_trigger(); Type: FUNCTION; Schema: public; Owner: margarita_user
--

CREATE FUNCTION public.actualizar_stock_trigger() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    UPDATE Productos
    SET stock_actual = stock_actual - NEW.cantidad
    WHERE id_producto = NEW.id_producto;

    RETURN NEW;
END;
$$;


ALTER FUNCTION public.actualizar_stock_trigger() OWNER TO margarita_user;

--
-- Name: actualizar_total_venta_trigger(); Type: FUNCTION; Schema: public; Owner: margarita_user
--

CREATE FUNCTION public.actualizar_total_venta_trigger() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    UPDATE Ventas
    SET monto_total = (
        SELECT COALESCE(SUM(subtotal), 0)
        FROM Detalle_Venta
        WHERE id_venta = NEW.id_venta
    )
    WHERE id_venta = NEW.id_venta;

    RETURN NEW;
END;
$$;


ALTER FUNCTION public.actualizar_total_venta_trigger() OWNER TO margarita_user;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: cajas; Type: TABLE; Schema: public; Owner: margarita_user
--

CREATE TABLE public.cajas (
    diferencia numeric(38,2),
    id_caja integer NOT NULL,
    id_usuario integer NOT NULL,
    monto_inicial numeric(38,2) NOT NULL,
    monto_real numeric(38,2),
    monto_sistema numeric(38,2),
    fecha_apertura timestamp(6) without time zone NOT NULL,
    fecha_cierre timestamp(6) without time zone,
    estado character varying(20) NOT NULL
);


ALTER TABLE public.cajas OWNER TO margarita_user;

--
-- Name: cajas_id_caja_seq; Type: SEQUENCE; Schema: public; Owner: margarita_user
--

ALTER TABLE public.cajas ALTER COLUMN id_caja ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.cajas_id_caja_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: categorias; Type: TABLE; Schema: public; Owner: margarita_user
--

CREATE TABLE public.categorias (
    id_categoria integer NOT NULL,
    id_categoria_padre integer,
    codigo_corto character varying(10),
    nombre character varying(100) NOT NULL,
    descripcion character varying(255)
);


ALTER TABLE public.categorias OWNER TO margarita_user;

--
-- Name: categorias_id_categoria_seq; Type: SEQUENCE; Schema: public; Owner: margarita_user
--

ALTER TABLE public.categorias ALTER COLUMN id_categoria ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.categorias_id_categoria_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: clientes; Type: TABLE; Schema: public; Owner: margarita_user
--

CREATE TABLE public.clientes (
    id_cliente integer NOT NULL,
    dni character varying(11),
    fecha_registro timestamp(6) without time zone,
    celular character varying(9) NOT NULL,
    apellidos character varying(150),
    nombres character varying(150) NOT NULL,
    email character varying(255)
);


ALTER TABLE public.clientes OWNER TO margarita_user;

--
-- Name: clientes_id_cliente_seq; Type: SEQUENCE; Schema: public; Owner: margarita_user
--

ALTER TABLE public.clientes ALTER COLUMN id_cliente ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.clientes_id_cliente_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: cupones; Type: TABLE; Schema: public; Owner: margarita_user
--

CREATE TABLE public.cupones (
    activo boolean NOT NULL,
    fecha_vencimiento date NOT NULL,
    hora_fin time(6) without time zone,
    hora_inicio time(6) without time zone,
    id_cupom integer NOT NULL,
    usos_disponibles integer NOT NULL,
    valor numeric(38,2) NOT NULL,
    codigo character varying(255) NOT NULL,
    dias_permitidos character varying(255),
    tipo_descuento character varying(255) NOT NULL,
    monto_minimo numeric(38,2)
);


ALTER TABLE public.cupones OWNER TO margarita_user;

--
-- Name: cupones_id_cupom_seq; Type: SEQUENCE; Schema: public; Owner: margarita_user
--

ALTER TABLE public.cupones ALTER COLUMN id_cupom ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.cupones_id_cupom_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: detalle_venta; Type: TABLE; Schema: public; Owner: margarita_user
--

CREATE TABLE public.detalle_venta (
    cantidad integer NOT NULL,
    id_detalle integer NOT NULL,
    id_producto integer NOT NULL,
    id_variante integer,
    id_venta integer,
    precio_unitario numeric(38,2) NOT NULL,
    subtotal numeric(38,2) NOT NULL,
    id_sucursal integer
);


ALTER TABLE public.detalle_venta OWNER TO margarita_user;

--
-- Name: detalle_venta_id_detalle_seq; Type: SEQUENCE; Schema: public; Owner: margarita_user
--

ALTER TABLE public.detalle_venta ALTER COLUMN id_detalle ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.detalle_venta_id_detalle_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: imagenes_producto; Type: TABLE; Schema: public; Owner: margarita_user
--

CREATE TABLE public.imagenes_producto (
    id_imagen integer NOT NULL,
    id_producto integer,
    id_variante integer,
    orden integer,
    descripcion_alt character varying(255),
    url_imagen character varying(255) NOT NULL
);


ALTER TABLE public.imagenes_producto OWNER TO margarita_user;

--
-- Name: imagenes_producto_id_imagen_seq; Type: SEQUENCE; Schema: public; Owner: margarita_user
--

ALTER TABLE public.imagenes_producto ALTER COLUMN id_imagen ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.imagenes_producto_id_imagen_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: inventario_sucursal; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.inventario_sucursal (
    id_inventario integer NOT NULL,
    stock_actual integer NOT NULL,
    id_sucursal integer,
    id_variante integer
);


ALTER TABLE public.inventario_sucursal OWNER TO postgres;

--
-- Name: inventario_sucursal_id_inventario_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.inventario_sucursal ALTER COLUMN id_inventario ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.inventario_sucursal_id_inventario_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: marcas; Type: TABLE; Schema: public; Owner: margarita_user
--

CREATE TABLE public.marcas (
    id_marca integer NOT NULL,
    codigo_corto character varying(10),
    descripcion character varying(255),
    nombre character varying(255) NOT NULL
);


ALTER TABLE public.marcas OWNER TO margarita_user;

--
-- Name: marcas_id_marca_seq; Type: SEQUENCE; Schema: public; Owner: margarita_user
--

ALTER TABLE public.marcas ALTER COLUMN id_marca ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.marcas_id_marca_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: movimientos; Type: TABLE; Schema: public; Owner: margarita_user
--

CREATE TABLE public.movimientos (
    id_movimiento integer NOT NULL,
    comentario character varying(255),
    comprobante character varying(255),
    fecha timestamp(6) without time zone NOT NULL,
    monto double precision NOT NULL,
    tipo character varying(255) NOT NULL,
    id_cliente integer NOT NULL
);


ALTER TABLE public.movimientos OWNER TO margarita_user;

--
-- Name: movimientos_id_movimiento_seq; Type: SEQUENCE; Schema: public; Owner: margarita_user
--

ALTER TABLE public.movimientos ALTER COLUMN id_movimiento ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.movimientos_id_movimiento_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: producto_variantes; Type: TABLE; Schema: public; Owner: margarita_user
--

CREATE TABLE public.producto_variantes (
    id_producto integer,
    id_variante integer NOT NULL,
    stock_actual integer NOT NULL,
    color character varying(50),
    talla character varying(50),
    sku_variante character varying(255),
    url_imagen character varying(255)
);


ALTER TABLE public.producto_variantes OWNER TO margarita_user;

--
-- Name: producto_variantes_id_variante_seq; Type: SEQUENCE; Schema: public; Owner: margarita_user
--

ALTER TABLE public.producto_variantes ALTER COLUMN id_variante ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.producto_variantes_id_variante_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: productos; Type: TABLE; Schema: public; Owner: margarita_user
--

CREATE TABLE public.productos (
    id_categoria integer,
    id_marca integer,
    id_producto integer NOT NULL,
    precio_compra numeric(38,2),
    precio_regular numeric(38,2),
    precio_venta numeric(38,2) NOT NULL,
    stock_actual integer NOT NULL,
    codigo_sku character varying(255) NOT NULL,
    descripcion character varying(255),
    nombre character varying(255) NOT NULL,
    url_imagen character varying(255),
    caracteristicas jsonb,
    en_oferta boolean DEFAULT false,
    id_sucursal integer,
    CONSTRAINT productos_stock_actual_check CHECK ((stock_actual >= 0))
);


ALTER TABLE public.productos OWNER TO margarita_user;

--
-- Name: productos_id_producto_seq; Type: SEQUENCE; Schema: public; Owner: margarita_user
--

ALTER TABLE public.productos ALTER COLUMN id_producto ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.productos_id_producto_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: sucursal; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sucursal (
    id_sucursal integer NOT NULL,
    nombre character varying(255) NOT NULL
);


ALTER TABLE public.sucursal OWNER TO postgres;

--
-- Name: sucursal_id_sucursal_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.sucursal ALTER COLUMN id_sucursal ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.sucursal_id_sucursal_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: sucursales; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sucursales (
    id_sucursal integer NOT NULL,
    nombre character varying(255) NOT NULL
);


ALTER TABLE public.sucursales OWNER TO postgres;

--
-- Name: sucursales_id_sucursal_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.sucursales ALTER COLUMN id_sucursal ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.sucursales_id_sucursal_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: usuarios; Type: TABLE; Schema: public; Owner: margarita_user
--

CREATE TABLE public.usuarios (
    activo boolean,
    id_usuario integer NOT NULL,
    fecha_creacion timestamp(6) without time zone,
    celular character varying(9),
    rol character varying(50) NOT NULL,
    nombre_usuario character varying(100) NOT NULL,
    apellidos character varying(150),
    nombres character varying(150),
    hash_contrasena character varying(255) NOT NULL,
    permisos jsonb
);


ALTER TABLE public.usuarios OWNER TO margarita_user;

--
-- Name: usuarios_id_usuario_seq; Type: SEQUENCE; Schema: public; Owner: margarita_user
--

ALTER TABLE public.usuarios ALTER COLUMN id_usuario ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.usuarios_id_usuario_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: ventas; Type: TABLE; Schema: public; Owner: margarita_user
--

CREATE TABLE public.ventas (
    id_cliente integer,
    id_cupom integer,
    id_usuario integer NOT NULL,
    id_venta integer NOT NULL,
    monto_descuento numeric(38,2),
    total numeric(38,2) DEFAULT 0 NOT NULL,
    fecha_venta timestamp(6) without time zone,
    estado character varying(255),
    tipo_comprobante character varying(255) NOT NULL
);


ALTER TABLE public.ventas OWNER TO margarita_user;

--
-- Name: ventas_id_venta_seq; Type: SEQUENCE; Schema: public; Owner: margarita_user
--

ALTER TABLE public.ventas ALTER COLUMN id_venta ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.ventas_id_venta_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Data for Name: cajas; Type: TABLE DATA; Schema: public; Owner: margarita_user
--

COPY public.cajas (diferencia, id_caja, id_usuario, monto_inicial, monto_real, monto_sistema, fecha_apertura, fecha_cierre, estado) FROM stdin;
\.


--
-- Data for Name: categorias; Type: TABLE DATA; Schema: public; Owner: margarita_user
--

COPY public.categorias (id_categoria, id_categoria_padre, codigo_corto, nombre, descripcion) FROM stdin;
1	\N	\N	Hogar	
3	1	\N	Cama	
4	3	\N	Sabanas	
7	3	\N	Protector de Colchon	
8	1	\N	Cortinas	
9	8	\N	Cortina para riel	
10	8	\N	Cortinas con Aro	
11	1	\N	Cabeceras	
12	11	\N	Almohadas	
13	11	\N	 Funda de Almohada	
14	\N	\N	Hombre	
15	14	\N	Ropa	
16	15	\N	Pantalon	
17	14	\N	Ropa interior y pijamas	
18	14	\N	Calzado	
19	17	\N	Boxers	
20	17	\N	Calzoncillos	
21	15	\N	Camisas	
23	15	\N	Polo Manga Larga	
22	15	\N	Polo Manga Corta	
24	\N	\N	Mujer	
25	24	\N	Ropa	
26	25	\N	 Polo Manga Corta	
27	25	\N	Pantalon	
\.


--
-- Data for Name: clientes; Type: TABLE DATA; Schema: public; Owner: margarita_user
--

COPY public.clientes (id_cliente, dni, fecha_registro, celular, apellidos, nombres, email) FROM stdin;
\.


--
-- Data for Name: cupones; Type: TABLE DATA; Schema: public; Owner: margarita_user
--

COPY public.cupones (activo, fecha_vencimiento, hora_fin, hora_inicio, id_cupom, usos_disponibles, valor, codigo, dias_permitidos, tipo_descuento, monto_minimo) FROM stdin;
\.


--
-- Data for Name: detalle_venta; Type: TABLE DATA; Schema: public; Owner: margarita_user
--

COPY public.detalle_venta (cantidad, id_detalle, id_producto, id_variante, id_venta, precio_unitario, subtotal, id_sucursal) FROM stdin;
\.


--
-- Data for Name: imagenes_producto; Type: TABLE DATA; Schema: public; Owner: margarita_user
--

COPY public.imagenes_producto (id_imagen, id_producto, id_variante, orden, descripcion_alt, url_imagen) FROM stdin;
\.


--
-- Data for Name: inventario_sucursal; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.inventario_sucursal (id_inventario, stock_actual, id_sucursal, id_variante) FROM stdin;
\.


--
-- Data for Name: marcas; Type: TABLE DATA; Schema: public; Owner: margarita_user
--

COPY public.marcas (id_marca, codigo_corto, descripcion, nombre) FROM stdin;
1	\N		Adidas
2	\N		Nike
3	\N		Goldsun
4	\N		Casatex
\.


--
-- Data for Name: movimientos; Type: TABLE DATA; Schema: public; Owner: margarita_user
--

COPY public.movimientos (id_movimiento, comentario, comprobante, fecha, monto, tipo, id_cliente) FROM stdin;
\.


--
-- Data for Name: producto_variantes; Type: TABLE DATA; Schema: public; Owner: margarita_user
--

COPY public.producto_variantes (id_producto, id_variante, stock_actual, color, talla, sku_variante, url_imagen) FROM stdin;
\.


--
-- Data for Name: productos; Type: TABLE DATA; Schema: public; Owner: margarita_user
--

COPY public.productos (id_categoria, id_marca, id_producto, precio_compra, precio_regular, precio_venta, stock_actual, codigo_sku, descripcion, nombre, url_imagen, caracteristicas, en_oferta, id_sucursal) FROM stdin;
\.


--
-- Data for Name: sucursal; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sucursal (id_sucursal, nombre) FROM stdin;
1	Ropa
3	Almacén
2	Hogar
4	Almacén 2do Piso
\.


--
-- Data for Name: sucursales; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sucursales (id_sucursal, nombre) FROM stdin;
1	Ropa
2	Hogar
3	Almacén
4	Almacén 2do Piso
\.


--
-- Data for Name: usuarios; Type: TABLE DATA; Schema: public; Owner: margarita_user
--

COPY public.usuarios (activo, id_usuario, fecha_creacion, celular, rol, nombre_usuario, apellidos, nombres, hash_contrasena, permisos) FROM stdin;
t	2	2025-12-15 22:18:24.253725	999999999	ADMIN	admin	Admin	Super	$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG	\N
t	3	\N	900944156	ADMIN	hugomeneses	Meneses Inca	Hugo Mishell	$2a$10$BNxzxkoLKrKnGik5TRiEXey54uW.Jy3.T29ldCyC6xd6tbXpnh23y	[]
t	4	\N	945641651	VENDEDOR	bubuchita	Alcala Peralta	Angie Nicole	$2a$10$51s5DrgtO0K2GCvuN5gI7Ov3uJ577cdLsbqxJ2m3iOhfHPsbL1UCC	[]
\.


--
-- Data for Name: ventas; Type: TABLE DATA; Schema: public; Owner: margarita_user
--

COPY public.ventas (id_cliente, id_cupom, id_usuario, id_venta, monto_descuento, total, fecha_venta, estado, tipo_comprobante) FROM stdin;
\.


--
-- Name: cajas_id_caja_seq; Type: SEQUENCE SET; Schema: public; Owner: margarita_user
--

SELECT pg_catalog.setval('public.cajas_id_caja_seq', 1, false);


--
-- Name: categorias_id_categoria_seq; Type: SEQUENCE SET; Schema: public; Owner: margarita_user
--

SELECT pg_catalog.setval('public.categorias_id_categoria_seq', 27, true);


--
-- Name: clientes_id_cliente_seq; Type: SEQUENCE SET; Schema: public; Owner: margarita_user
--

SELECT pg_catalog.setval('public.clientes_id_cliente_seq', 10, true);


--
-- Name: cupones_id_cupom_seq; Type: SEQUENCE SET; Schema: public; Owner: margarita_user
--

SELECT pg_catalog.setval('public.cupones_id_cupom_seq', 1, true);


--
-- Name: detalle_venta_id_detalle_seq; Type: SEQUENCE SET; Schema: public; Owner: margarita_user
--

SELECT pg_catalog.setval('public.detalle_venta_id_detalle_seq', 9, true);


--
-- Name: imagenes_producto_id_imagen_seq; Type: SEQUENCE SET; Schema: public; Owner: margarita_user
--

SELECT pg_catalog.setval('public.imagenes_producto_id_imagen_seq', 1, false);


--
-- Name: inventario_sucursal_id_inventario_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.inventario_sucursal_id_inventario_seq', 60, true);


--
-- Name: marcas_id_marca_seq; Type: SEQUENCE SET; Schema: public; Owner: margarita_user
--

SELECT pg_catalog.setval('public.marcas_id_marca_seq', 4, true);


--
-- Name: movimientos_id_movimiento_seq; Type: SEQUENCE SET; Schema: public; Owner: margarita_user
--

SELECT pg_catalog.setval('public.movimientos_id_movimiento_seq', 1, false);


--
-- Name: producto_variantes_id_variante_seq; Type: SEQUENCE SET; Schema: public; Owner: margarita_user
--

SELECT pg_catalog.setval('public.producto_variantes_id_variante_seq', 21, true);


--
-- Name: productos_id_producto_seq; Type: SEQUENCE SET; Schema: public; Owner: margarita_user
--

SELECT pg_catalog.setval('public.productos_id_producto_seq', 9, true);


--
-- Name: sucursal_id_sucursal_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sucursal_id_sucursal_seq', 1, false);


--
-- Name: sucursales_id_sucursal_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sucursales_id_sucursal_seq', 1, false);


--
-- Name: usuarios_id_usuario_seq; Type: SEQUENCE SET; Schema: public; Owner: margarita_user
--

SELECT pg_catalog.setval('public.usuarios_id_usuario_seq', 9, true);


--
-- Name: ventas_id_venta_seq; Type: SEQUENCE SET; Schema: public; Owner: margarita_user
--

SELECT pg_catalog.setval('public.ventas_id_venta_seq', 6, true);


--
-- Name: cajas cajas_pkey; Type: CONSTRAINT; Schema: public; Owner: margarita_user
--

ALTER TABLE ONLY public.cajas
    ADD CONSTRAINT cajas_pkey PRIMARY KEY (id_caja);


--
-- Name: categorias categorias_pkey; Type: CONSTRAINT; Schema: public; Owner: margarita_user
--

ALTER TABLE ONLY public.categorias
    ADD CONSTRAINT categorias_pkey PRIMARY KEY (id_categoria);


--
-- Name: clientes clientes_dni_key; Type: CONSTRAINT; Schema: public; Owner: margarita_user
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_dni_key UNIQUE (dni);


--
-- Name: clientes clientes_email_key; Type: CONSTRAINT; Schema: public; Owner: margarita_user
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_email_key UNIQUE (email);


--
-- Name: clientes clientes_pkey; Type: CONSTRAINT; Schema: public; Owner: margarita_user
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_pkey PRIMARY KEY (id_cliente);


--
-- Name: cupones cupones_codigo_key; Type: CONSTRAINT; Schema: public; Owner: margarita_user
--

ALTER TABLE ONLY public.cupones
    ADD CONSTRAINT cupones_codigo_key UNIQUE (codigo);


--
-- Name: cupones cupones_pkey; Type: CONSTRAINT; Schema: public; Owner: margarita_user
--

ALTER TABLE ONLY public.cupones
    ADD CONSTRAINT cupones_pkey PRIMARY KEY (id_cupom);


--
-- Name: detalle_venta detalle_venta_pkey; Type: CONSTRAINT; Schema: public; Owner: margarita_user
--

ALTER TABLE ONLY public.detalle_venta
    ADD CONSTRAINT detalle_venta_pkey PRIMARY KEY (id_detalle);


--
-- Name: imagenes_producto imagenes_producto_pkey; Type: CONSTRAINT; Schema: public; Owner: margarita_user
--

ALTER TABLE ONLY public.imagenes_producto
    ADD CONSTRAINT imagenes_producto_pkey PRIMARY KEY (id_imagen);


--
-- Name: inventario_sucursal inventario_sucursal_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventario_sucursal
    ADD CONSTRAINT inventario_sucursal_pkey PRIMARY KEY (id_inventario);


--
-- Name: marcas marcas_nombre_key; Type: CONSTRAINT; Schema: public; Owner: margarita_user
--

ALTER TABLE ONLY public.marcas
    ADD CONSTRAINT marcas_nombre_key UNIQUE (nombre);


--
-- Name: marcas marcas_pkey; Type: CONSTRAINT; Schema: public; Owner: margarita_user
--

ALTER TABLE ONLY public.marcas
    ADD CONSTRAINT marcas_pkey PRIMARY KEY (id_marca);


--
-- Name: movimientos movimientos_pkey; Type: CONSTRAINT; Schema: public; Owner: margarita_user
--

ALTER TABLE ONLY public.movimientos
    ADD CONSTRAINT movimientos_pkey PRIMARY KEY (id_movimiento);


--
-- Name: producto_variantes producto_variantes_pkey; Type: CONSTRAINT; Schema: public; Owner: margarita_user
--

ALTER TABLE ONLY public.producto_variantes
    ADD CONSTRAINT producto_variantes_pkey PRIMARY KEY (id_variante);


--
-- Name: productos productos_codigo_sku_key; Type: CONSTRAINT; Schema: public; Owner: margarita_user
--

ALTER TABLE ONLY public.productos
    ADD CONSTRAINT productos_codigo_sku_key UNIQUE (codigo_sku);


--
-- Name: productos productos_pkey; Type: CONSTRAINT; Schema: public; Owner: margarita_user
--

ALTER TABLE ONLY public.productos
    ADD CONSTRAINT productos_pkey PRIMARY KEY (id_producto);


--
-- Name: sucursal sucursal_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sucursal
    ADD CONSTRAINT sucursal_pkey PRIMARY KEY (id_sucursal);


--
-- Name: sucursales sucursales_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sucursales
    ADD CONSTRAINT sucursales_pkey PRIMARY KEY (id_sucursal);


--
-- Name: sucursales uk8bv0gcsxqwmc5r68oriq9l759; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sucursales
    ADD CONSTRAINT uk8bv0gcsxqwmc5r68oriq9l759 UNIQUE (nombre);


--
-- Name: sucursal ukoo3ck5046t6g7t2o87h3r0qjr; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sucursal
    ADD CONSTRAINT ukoo3ck5046t6g7t2o87h3r0qjr UNIQUE (nombre);


--
-- Name: usuarios usuarios_nombre_usuario_key; Type: CONSTRAINT; Schema: public; Owner: margarita_user
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_nombre_usuario_key UNIQUE (nombre_usuario);


--
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: margarita_user
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id_usuario);


--
-- Name: ventas ventas_pkey; Type: CONSTRAINT; Schema: public; Owner: margarita_user
--

ALTER TABLE ONLY public.ventas
    ADD CONSTRAINT ventas_pkey PRIMARY KEY (id_venta);


--
-- Name: detalle_venta fk2ens3kcdecgap5og51rbsp1h0; Type: FK CONSTRAINT; Schema: public; Owner: margarita_user
--

ALTER TABLE ONLY public.detalle_venta
    ADD CONSTRAINT fk2ens3kcdecgap5og51rbsp1h0 FOREIGN KEY (id_variante) REFERENCES public.producto_variantes(id_variante);


--
-- Name: productos fk4npgwl82bnp4qwmi05mhi4ghi; Type: FK CONSTRAINT; Schema: public; Owner: margarita_user
--

ALTER TABLE ONLY public.productos
    ADD CONSTRAINT fk4npgwl82bnp4qwmi05mhi4ghi FOREIGN KEY (id_sucursal) REFERENCES public.sucursales(id_sucursal);


--
-- Name: imagenes_producto fk9bgwqaobnsa1muydxwo18en5r; Type: FK CONSTRAINT; Schema: public; Owner: margarita_user
--

ALTER TABLE ONLY public.imagenes_producto
    ADD CONSTRAINT fk9bgwqaobnsa1muydxwo18en5r FOREIGN KEY (id_producto) REFERENCES public.productos(id_producto);


--
-- Name: ventas fk9mbivrllsn9jffa05x77l5mc1; Type: FK CONSTRAINT; Schema: public; Owner: margarita_user
--

ALTER TABLE ONLY public.ventas
    ADD CONSTRAINT fk9mbivrllsn9jffa05x77l5mc1 FOREIGN KEY (id_cupom) REFERENCES public.cupones(id_cupom);


--
-- Name: categorias fkbt5pdc52jh54l2o97ic983j26; Type: FK CONSTRAINT; Schema: public; Owner: margarita_user
--

ALTER TABLE ONLY public.categorias
    ADD CONSTRAINT fkbt5pdc52jh54l2o97ic983j26 FOREIGN KEY (id_categoria_padre) REFERENCES public.categorias(id_categoria);


--
-- Name: productos fkc1mrc7r89nch4xtol227kdwce; Type: FK CONSTRAINT; Schema: public; Owner: margarita_user
--

ALTER TABLE ONLY public.productos
    ADD CONSTRAINT fkc1mrc7r89nch4xtol227kdwce FOREIGN KEY (id_marca) REFERENCES public.marcas(id_marca);


--
-- Name: productos fkdtoa37luoxhhvbicrfiu5ygbj; Type: FK CONSTRAINT; Schema: public; Owner: margarita_user
--

ALTER TABLE ONLY public.productos
    ADD CONSTRAINT fkdtoa37luoxhhvbicrfiu5ygbj FOREIGN KEY (id_categoria) REFERENCES public.categorias(id_categoria);


--
-- Name: detalle_venta fke92fd2auy9ms2pvac9b4n8ttq; Type: FK CONSTRAINT; Schema: public; Owner: margarita_user
--

ALTER TABLE ONLY public.detalle_venta
    ADD CONSTRAINT fke92fd2auy9ms2pvac9b4n8ttq FOREIGN KEY (id_producto) REFERENCES public.productos(id_producto);


--
-- Name: detalle_venta fkgds50vmwbs8lxoti80iekstyi; Type: FK CONSTRAINT; Schema: public; Owner: margarita_user
--

ALTER TABLE ONLY public.detalle_venta
    ADD CONSTRAINT fkgds50vmwbs8lxoti80iekstyi FOREIGN KEY (id_venta) REFERENCES public.ventas(id_venta);


--
-- Name: movimientos fkggso8fbp0cpimqjskv15qu917; Type: FK CONSTRAINT; Schema: public; Owner: margarita_user
--

ALTER TABLE ONLY public.movimientos
    ADD CONSTRAINT fkggso8fbp0cpimqjskv15qu917 FOREIGN KEY (id_cliente) REFERENCES public.clientes(id_cliente);


--
-- Name: cajas fkkal46lhycb4457wk2b7r9gb80; Type: FK CONSTRAINT; Schema: public; Owner: margarita_user
--

ALTER TABLE ONLY public.cajas
    ADD CONSTRAINT fkkal46lhycb4457wk2b7r9gb80 FOREIGN KEY (id_usuario) REFERENCES public.usuarios(id_usuario);


--
-- Name: inventario_sucursal fkko2j7bpx7qs3hch4dw7mwq9gv; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventario_sucursal
    ADD CONSTRAINT fkko2j7bpx7qs3hch4dw7mwq9gv FOREIGN KEY (id_sucursal) REFERENCES public.sucursales(id_sucursal);


--
-- Name: ventas fkleerof1mym3gc1ah8hsarel3f; Type: FK CONSTRAINT; Schema: public; Owner: margarita_user
--

ALTER TABLE ONLY public.ventas
    ADD CONSTRAINT fkleerof1mym3gc1ah8hsarel3f FOREIGN KEY (id_cliente) REFERENCES public.clientes(id_cliente);


--
-- Name: imagenes_producto fkmlw1jk3iwkgb04aea290rp09x; Type: FK CONSTRAINT; Schema: public; Owner: margarita_user
--

ALTER TABLE ONLY public.imagenes_producto
    ADD CONSTRAINT fkmlw1jk3iwkgb04aea290rp09x FOREIGN KEY (id_variante) REFERENCES public.producto_variantes(id_variante);


--
-- Name: inventario_sucursal fkn1javdhfp7no68us41v6ib4sd; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventario_sucursal
    ADD CONSTRAINT fkn1javdhfp7no68us41v6ib4sd FOREIGN KEY (id_variante) REFERENCES public.producto_variantes(id_variante);


--
-- Name: ventas fkngvsjlvvv240ohesoj9e87s3h; Type: FK CONSTRAINT; Schema: public; Owner: margarita_user
--

ALTER TABLE ONLY public.ventas
    ADD CONSTRAINT fkngvsjlvvv240ohesoj9e87s3h FOREIGN KEY (id_usuario) REFERENCES public.usuarios(id_usuario);


--
-- Name: producto_variantes fkq7ega29yp2m3irjvvrfrwsq6i; Type: FK CONSTRAINT; Schema: public; Owner: margarita_user
--

ALTER TABLE ONLY public.producto_variantes
    ADD CONSTRAINT fkq7ega29yp2m3irjvvrfrwsq6i FOREIGN KEY (id_producto) REFERENCES public.productos(id_producto);


--
-- Name: productos fks3ykp9acfeoc2l7qmnodyhn1f; Type: FK CONSTRAINT; Schema: public; Owner: margarita_user
--

ALTER TABLE ONLY public.productos
    ADD CONSTRAINT fks3ykp9acfeoc2l7qmnodyhn1f FOREIGN KEY (id_sucursal) REFERENCES public.sucursal(id_sucursal);


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: margarita_user
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- Name: TABLE inventario_sucursal; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.inventario_sucursal TO margarita_user;


--
-- Name: SEQUENCE inventario_sucursal_id_inventario_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.inventario_sucursal_id_inventario_seq TO margarita_user;


--
-- Name: TABLE sucursal; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.sucursal TO margarita_user;


--
-- Name: SEQUENCE sucursal_id_sucursal_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.sucursal_id_sucursal_seq TO margarita_user;


--
-- Name: TABLE sucursales; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.sucursales TO margarita_user;


--
-- Name: SEQUENCE sucursales_id_sucursal_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.sucursales_id_sucursal_seq TO margarita_user;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: -; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres GRANT ALL ON SEQUENCES TO margarita_user;


--
-- Name: DEFAULT PRIVILEGES FOR TYPES; Type: DEFAULT ACL; Schema: -; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres GRANT ALL ON TYPES TO margarita_user;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: -; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres GRANT ALL ON FUNCTIONS TO margarita_user;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: -; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres GRANT ALL ON TABLES TO margarita_user;


--
-- PostgreSQL database dump complete
--

\unrestrict 1CoskJwYHafh9qY08RoNPznMG6iXghndiE7gaT3mQ3YOTlxF5bWXIkns1jhsaYg

