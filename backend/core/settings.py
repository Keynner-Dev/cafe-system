from pathlib import Path
from dotenv import load_dotenv
import os
import dj_database_url  # ← NUEVO: para leer DATABASE_URL como una sola cadena

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

# ─── Seguridad ────────────────────────────────────────────────────────────
SECRET_KEY = os.getenv('SECRET_KEY')
DEBUG = os.getenv('DEBUG', 'False') == 'True'

if not SECRET_KEY:
    if DEBUG:
        # Solo para desarrollo local si olvidaste poner SECRET_KEY en .env
        SECRET_KEY = 'django-insecure-solo-desarrollo-local-NUNCA-en-produccion'
    else:
        raise Exception(
            'SECRET_KEY no está configurada. '
            'Defínela como variable de entorno antes de desplegar a producción.'
        )

ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework.authtoken',
    'django_filters',  # ← NUEVO (ítem 17): filtros combinables en tablas
    'corsheaders',
    'usuarios',
    'terceros',
    'inventario',
    'compras',
    'ventas',
    'precios',
    'dashboard',
    'caja',
    'gastos',
    'cuentas_pagar',
    'letras_cambio',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'core.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'core.wsgi.application'

# ─── Base de datos ────────────────────────────────────────────────────────
# ANTES: 5 variables sueltas (DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, DB_PORT).
# AHORA: una sola variable DATABASE_URL con la cadena de conexión completa,
# tal como la entrega Neon. dj_database_url la interpreta automáticamente,
# incluyendo el ?sslmode=require si viene en la cadena.
DATABASE_URL = os.getenv('DATABASE_URL')

if not DATABASE_URL:
    raise Exception(
        'DATABASE_URL no está configurada. '
        'Defínela en el .env (local) o en las variables de entorno (Railway).'
    )

DATABASES = {
    'default': dj_database_url.parse(DATABASE_URL)
}

AUTH_USER_MODEL = 'usuarios.Usuario'

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'es-co'
TIME_ZONE = 'America/Bogota'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STORAGES = {
    'staticfiles': {
        'BACKEND': 'whitenoise.storage.CompressedManifestStaticFilesStorage',
    },
}

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ─── CORS — ya NO permitimos cualquier origen ────────────────────────────
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = os.getenv(
    'CORS_ALLOWED_ORIGINS', 'http://localhost:5173'
).split(',')
CORS_ALLOW_CREDENTIALS = True

CSRF_TRUSTED_ORIGINS = (
    os.getenv('CSRF_TRUSTED_ORIGINS').split(',')
    if os.getenv('CSRF_TRUSTED_ORIGINS') else []
)

# ─── Seguridad extra solo en producción ──────────────────────────────────
if not DEBUG:
    SECURE_SSL_REDIRECT = True
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'portal_caficultor': '5/min',
    },

    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 10,

    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
    ],
}