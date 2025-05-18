import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('Iniciando seed...');

    // Limpiar datos existentes
    await cleanData();

    // Crear datos de prueba
    await createDepartments();
    await createCities();
    await createMusicalGenres();
    await createInstruments();
    await createPaymentMethods();
    await createReservationStatus();
    await createEvents();
    await createUsers();
    await updateMusiciansWithEvents();
    await createSampleReviews();
    await createSampleReservations();

    console.log('Seed completado con éxito!');
}

async function cleanData() {
    console.log('Limpiando datos existentes...');

    // El orden es importante para evitar errores de relaciones
    await prisma.conversation.deleteMany({});
    await prisma.review.deleteMany({});
    await prisma.completedreservation.deleteMany({});
    await prisma.reservation.deleteMany({});
    await prisma.media.deleteMany({});
    await prisma.musiciangenre.deleteMany({});
    await prisma.musicianinstrument.deleteMany({});
    await prisma.musicianevent.deleteMany({});
    await prisma.client.deleteMany({});
    await prisma.musician.deleteMany({});
    await prisma.city.deleteMany({});
    await prisma.department.deleteMany({});
    await prisma.musicalgenre.deleteMany({});
    await prisma.instrument.deleteMany({});
    await prisma.event.deleteMany({});
    await prisma.paymentmethod.deleteMany({});
    await prisma.reservationstatus.deleteMany({});
    await prisma.requeststatus.deleteMany({});
}

async function createDepartments() {
    console.log('Creando departamentos...');

    const departments = [
        { name: 'Risaralda' },
        { name: 'Antioquia' },
        { name: 'Valle del Cauca' },
        { name: 'Cundinamarca' },
        { name: 'Caldas' },
        { name: 'Quindío' },
        { name: 'Atlántico' },
        { name: 'Bolívar' },
        { name: 'Santander' },
        { name: 'Norte de Santander' }
    ];

    for (const department of departments) {
        await prisma.department.create({
            data: department
        });
    }

    console.log(`✅ Creados ${departments.length} departamentos`);
}

async function createCities() {
    console.log('Creando ciudades...');

    // Obtener departamentos
    const departments = await prisma.department.findMany();

    // Mapeo de departamento a nombre para facilitar la búsqueda
    const departmentMap = new Map(departments.map(dep => [dep.name, dep.id]));

    const cities = [
        { name: 'Pereira', departmentName: 'Risaralda' },
        { name: 'Dosquebradas', departmentName: 'Risaralda' },
        { name: 'Santa Rosa de Cabal', departmentName: 'Risaralda' },
        { name: 'Medellín', departmentName: 'Antioquia' },
        { name: 'Envigado', departmentName: 'Antioquia' },
        { name: 'Bello', departmentName: 'Antioquia' },
        { name: 'Cali', departmentName: 'Valle del Cauca' },
        { name: 'Palmira', departmentName: 'Valle del Cauca' },
        { name: 'Bogotá', departmentName: 'Cundinamarca' },
        { name: 'Zipaquirá', departmentName: 'Cundinamarca' },
        { name: 'Manizales', departmentName: 'Caldas' },
        { name: 'Armenia', departmentName: 'Quindío' },
        { name: 'Barranquilla', departmentName: 'Atlántico' },
        { name: 'Cartagena', departmentName: 'Bolívar' },
        { name: 'Bucaramanga', departmentName: 'Santander' },
        { name: 'Cúcuta', departmentName: 'Norte de Santander' }
    ];

    for (const city of cities) {
        const departmentId = departmentMap.get(city.departmentName);
        if (departmentId) {
            await prisma.city.create({
                data: {
                    name: city.name,
                    departmentId
                }
            });
        }
    }

    console.log(`✅ Creadas ${cities.length} ciudades`);
}

async function createMusicalGenres() {
    console.log('Creando géneros musicales...');

    const genres = [
        { name: 'Pop' },
        { name: 'Rock' },
        { name: 'Jazz' },
        { name: 'Clásica' },
        { name: 'Electrónica' },
        { name: 'Reggaeton' },
        { name: 'Salsa' },
        { name: 'Cumbia' },
        { name: 'Bolero' },
        { name: 'Merengue' },
        { name: 'Bachata' },
        { name: 'Vallenato' },
        { name: 'Balada' },
        { name: 'Hip Hop' },
        { name: 'Metal' },
        { name: 'Blues' },
        { name: 'Country' },
        { name: 'Indie' },
        { name: 'Flamenco' },
        { name: 'Mariachi' }
    ];

    for (const genre of genres) {
        await prisma.musicalgenre.create({
            data: genre
        });
    }

    console.log(`✅ Creados ${genres.length} géneros musicales`);
}

async function createInstruments() {
    console.log('Creando instrumentos...');

    const instruments = [
        { name: 'Guitarra' },
        { name: 'Piano' },
        { name: 'Violín' },
        { name: 'Batería' },
        { name: 'Bajo' },
        { name: 'Saxofón' },
        { name: 'Flauta' },
        { name: 'Trompeta' },
        { name: 'Clarinete' },
        { name: 'Violonchelo' },
        { name: 'Acordeón' },
        { name: 'Arpa' },
        { name: 'Trompa' },
        { name: 'Oboe' },
        { name: 'Banjo' },
        { name: 'Ukelele' },
        { name: 'Marimba' },
        { name: 'Sintetizador' },
        { name: 'Percusión' },
        { name: 'Voz' }
    ];

    for (const instrument of instruments) {
        await prisma.instrument.create({
            data: instrument
        });
    }

    console.log(`✅ Creados ${instruments.length} instrumentos`);
}

async function createPaymentMethods() {
    console.log('Creando métodos de pago...');

    const paymentMethods = [
        { name: 'Tarjeta de Crédito' },
        { name: 'Tarjeta de Débito' },
        { name: 'PayPal' },
        { name: 'Transferencia Bancaria' },
        { name: 'Efectivo' },
        { name: 'Nequi' },
        { name: 'Daviplata' }
    ];

    for (const method of paymentMethods) {
        await prisma.paymentmethod.create({
            data: method
        });
    }

    console.log(`✅ Creados ${paymentMethods.length} métodos de pago`);
}

async function createReservationStatus() {
    console.log('Creando estados de reserva...');

    const statuses = [
        { name: 'Pendiente' },
        { name: 'Completada' },
        { name: 'Cancelada' }
    ];

    for (const status of statuses) {
        await prisma.reservationstatus.create({
            data: status
        });
    }

    console.log(`✅ Creados ${statuses.length} estados de reserva`);
}

async function createEvents() {
    console.log('Creando tipos de eventos...');

    const events = [
        { name: "Bodas" },
        { name: "Eventos Corporativos" },
        { name: "Graduaciones" },
        { name: "Fiestas Privadas" },
        { name: "Cumpleaños" },
        { name: "Aniversarios" },
        { name: "Conciertos" },
        { name: "Festivales" }
    ];

    for (const event of events) {
        await prisma.event.create({
            data: event
        });
    }

    console.log(`✅ Creados ${events.length} tipos de eventos`);
}

async function updateMusiciansWithEvents() {
    console.log('Asignando eventos y precios a músicos...');

    // Obtener todos los músicos y eventos
    const musicians = await prisma.musician.findMany();
    const events = await prisma.event.findMany();

    // Para cada músico, asignar algunos eventos aleatorios y precios
    for (const musician of musicians) {
        // Asignar precios aleatorios
        const minPrice = Math.floor(Math.random() * 5 + 1) * 100000; // 100k-500k
        const maxPrice = minPrice + Math.floor(Math.random() * 5 + 1) * 100000; // minPrice + (100k-500k)

        // Actualizar el músico con los precios
        await prisma.musician.update({
            where: { id: musician.id },
            data: {
                minPrice,
                maxPrice
            }
        });

        // Seleccionar eventos aleatorios (entre 2 y 5)
        const numEvents = Math.floor(Math.random() * 4) + 2;
        const selectedEvents = [...events]
            .sort(() => 0.5 - Math.random())
            .slice(0, numEvents);

        // Crear relaciones entre músico y eventos
        for (const event of selectedEvents) {
            await prisma.musicianevent.create({
                data: {
                    musicianId: musician.id,
                    eventId: event.id
                }
            });
        }
    }

    console.log(`✅ Actualizados ${musicians.length} músicos con eventos y precios`);
}

async function createUsers() {
    console.log('Creando usuarios...');

    // Obtener géneros musicales e instrumentos para asignar a los músicos
    const genres = await prisma.musicalgenre.findMany();
    const instruments = await prisma.instrument.findMany();

    // Obtener ciudades para asignar a los usuarios
    const cities = await prisma.city.findMany();
    const pereiraCity = cities.find(city => city.name === 'Pereira')?.id;
    const medellinCity = cities.find(city => city.name === 'Medellín')?.id;
    const caliCity = cities.find(city => city.name === 'Cali')?.id;
    const bogotaCity = cities.find(city => city.name === 'Bogotá')?.id;
    const manizalesCity = cities.find(city => city.name === 'Manizales')?.id;

    // Crear músicos
    const musicians = [
        {
            username: 'musico1',
            password: await hash('123456', 10),
            name: 'Juan Pérez',
            email: 'juan@example.com',
            phone: '3201234567',
            genres: [genres[0].id, genres[1].id, genres[12].id],
            instruments: [instruments[0].id, instruments[4].id],
            cityId: bogotaCity,
            address: 'Calle 123 #45-67'
        },
        {
            username: 'musico2',
            password: await hash('123456', 10),
            name: 'María López',
            email: 'maria@example.com',
            phone: '3002587413',
            genres: [genres[6].id, genres[7].id, genres[10].id],
            instruments: [instruments[1].id, instruments[19].id],
            cityId: medellinCity,
            address: 'Carrera 78 #23-45'
        },
        {
            username: 'musico3',
            password: await hash('123456', 10),
            name: 'David Sánchez',
            email: 'david@example.com',
            phone: '3156987412',
            genres: [genres[3].id, genres[4].id],
            instruments: [instruments[2].id, instruments[9].id],
            cityId: caliCity,
            address: 'Avenida 5 Norte #45-12'
        },
        {
            username: 'musico4',
            password: await hash('123456', 10),
            name: 'Laura Jiménez',
            email: 'laura@example.com',
            phone: '3109632587',
            genres: [genres[8].id, genres[11].id],
            instruments: [instruments[5].id, instruments[19].id],
            cityId: manizalesCity,
            address: 'Calle 12 #34-56'
        },
        {
            username: 'musico5',
            password: await hash('123456', 10),
            name: 'Carlos Vives',
            email: 'carlosvives@example.com',
            phone: '3152345678',
            genres: [genres[2].id, genres[6].id, genres[7].id, genres[8].id],
            instruments: [instruments[0].id, instruments[19].id],
            cityId: pereiraCity,
            address: 'Carrera 15 #35-24, Dosquebradas'
        }
    ];

    for (const musician of musicians) {
        const { genres: genreIds, instruments: instrumentIds, ...musicianData } = musician;

        // Crear el músico
        const createdMusician = await prisma.musician.create({
            data: musicianData
        });

        // Agregar géneros musicales
        for (const genreId of genreIds) {
            await prisma.musiciangenre.create({
                data: {
                    musicianId: createdMusician.id,
                    musicalGenreId: genreId
                }
            });
        }

        // Agregar instrumentos
        for (const instrumentId of instrumentIds) {
            await prisma.musicianinstrument.create({
                data: {
                    musicianId: createdMusician.id,
                    instrumentId: instrumentId
                }
            });
        }

        // Agregar imágenes de perfil (en un escenario real serían URLs reales)
        await prisma.media.create({
            data: {
                musicianId: createdMusician.id,
                mediaType: 'image',
                filePath: '/images/profile.jpg'
            }
        });
    }

    console.log(`✅ Creados ${musicians.length} músicos`);

    // Crear algunas reseñas
    await createSampleReviews();

    // Crear algunas reservas
    await createSampleReservations();
}

async function createSampleReviews() {
    console.log('Creando reseñas de ejemplo...');

    // Ya que eliminamos la creación automática de clientes, 
    // no podemos crear reseñas que los involucren
    console.log('⚠️ No se crearán reseñas hasta que haya clientes registrados manualmente');
}

async function createSampleReservations() {
    console.log('Creando reservas de ejemplo...');

    // Ya que eliminamos la creación automática de clientes,
    // no podemos crear reservas que los involucren
    console.log('⚠️ No se crearán reservas hasta que haya clientes registrados manualmente');
}

main()
    .catch((e) => {
        console.error('Error en el seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    }); 