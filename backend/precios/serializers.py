from rest_framework import serializers
from .models import PrecioDiario

class PrecioDiarioSerializer(serializers.ModelSerializer):
    tipo_cafe_nombre = serializers.CharField(source='tipo_cafe.nombre', read_only=True)

    class Meta:
        model = PrecioDiario
        fields = '__all__'