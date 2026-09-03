import api from './axios'

export const getDashboard = () => api.get('/dashboard/')

export const getDepositosPendientesDetalle = () => api.get('/dashboard/depositos-pendientes/')