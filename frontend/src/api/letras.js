import api from './axios';

export const getLetras = (params = {}) =>
  api.get('/letras/', { params }).then(r => r.data);

export const createLetra = (data) =>
  api.post('/letras/', data).then(r => r.data);

export const updateLetra = (id, data) =>
  api.patch(`/letras/${id}/`, data).then(r => r.data);

export const getAbonosLetra = (letraId) =>
  api.get(`/letras/${letraId}/abonos/`).then(r => r.data);

export const createAbonoLetra = (letraId, data) =>
  api.post(`/letras/${letraId}/abonos/`, data).then(r => r.data);

// Para la notificación flotante en CompraModal: letras pendientes/parciales de un caficultor
export const getLetrasPendientesCaficultor = (caficultorId) =>
  api.get('/letras/', { params: { caficultor: caficultorId, estado: 'pendiente,parcial' } })
    .then(r => r.data);