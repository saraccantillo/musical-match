// Función para obtener la sesión del usuario desde localStorage
export async function getUserSession() {
    if (typeof window === 'undefined') {
        return null;
    }

    try {
        const userRole = localStorage.getItem('userRole');
        const userData = localStorage.getItem('userData');

        if (!userRole || !userData) {
            return null;
        }

        const user = JSON.parse(userData);

        return {
            role: userRole,
            id: user.id,
            name: user.name,
            email: user.email
        };
    } catch (error) {
        console.error('Error al obtener la sesión del usuario:', error);
        return null;
    }
} 