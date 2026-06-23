from django.apps import AppConfig


class LetrasCambioConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'letras_cambio'

    def ready(self):
        import letras_cambio.models  # registra las señales