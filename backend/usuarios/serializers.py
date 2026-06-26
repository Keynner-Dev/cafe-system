from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import Usuario


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=30)
    password = serializers.CharField(write_only=True, max_length=30)

    def validate(self, data):
        user = authenticate(
            username=data['username'],
            password=data['password']
        )
        if not user:
            raise serializers.ValidationError('Usuario o contraseña incorrectos.')
        if not user.is_active:
            raise serializers.ValidationError('Este usuario está desactivado.')
        data['user'] = user
        return data


class UsuarioSerializer(serializers.ModelSerializer):
    bodega_nombre = serializers.CharField(
        source='bodega.nombre',
        read_only=True,
        default=None
    )

    class Meta:
        model = Usuario
        fields = [
            'id', 'username', 'first_name', 'last_name',
            'email', 'rol', 'bodega', 'bodega_nombre', 'is_active'
        ]
        read_only_fields = ['id']


class UsuarioCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = Usuario
        fields = [
            'username', 'first_name', 'last_name',
            'email', 'password', 'rol', 'bodega'
        ]

    def validate(self, data):
        # El administrador DEBE tener bodega asignada
        if data.get('rol') == 'administrador' and not data.get('bodega'):
            raise serializers.ValidationError(
                {'bodega': 'El administrador debe tener una bodega asignada.'}
            )
        # El jefe NO debe tener bodega
        if data.get('rol') == 'jefe' and data.get('bodega'):
            raise serializers.ValidationError(
                {'bodega': 'El jefe no debe tener bodega asignada.'}
            )
        return data

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = Usuario(**validated_data)
        user.set_password(password)  # encripta la contraseña
        user.save()
        return user