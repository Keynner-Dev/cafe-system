from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Usuario


@admin.register(Usuario)
class UsuarioAdmin(UserAdmin):
    # Campos extra que queremos ver en el admin de Django
    fieldsets = UserAdmin.fieldsets + (
        ('Café System', {
            'fields': ('rol', 'bodega'),
        }),
    )
    list_display = ['username', 'get_full_name', 'email', 'rol', 'bodega', 'is_active']
    list_filter = ['rol', 'bodega', 'is_active']