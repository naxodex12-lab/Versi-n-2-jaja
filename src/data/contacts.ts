import { Contact } from '../types';

export const CONTACTS: Record<string, Contact> = {
  ana: {
    id: 'ana',
    name: 'Ana Salas',
    rut: '11.222.333-4',
    bank: 'BancoEstado',
    account: 'Cuenta Corriente · 11222333',
    aliases: ['ana', 'anna', 'salas'],
    initials: 'AS',
    isFavorite: false,
  },
  armando: {
    id: 'armando',
    name: 'Armando Paredes Rojas',
    rut: '20.358.963-3',
    bank: 'BancoEstado',
    account: 'CuentaRUT · 20358963',
    aliases: ['armando', 'paredes', 'rojas'],
    initials: 'AP',
    isFavorite: true,
  },
  belen: {
    id: 'belen',
    name: 'Belén Pardo Escobar',
    rut: '20.968.963-3',
    bank: 'BancoEstado',
    account: 'CuentaRUT · 20968963',
    aliases: ['belen', 'pardo', 'escobar'],
    initials: 'BP',
    isFavorite: true,
  },
  carlos: {
    id: 'carlos',
    name: 'Carlos Valdés',
    rut: '9.876.543-2',
    bank: 'Banco de Chile',
    account: 'Cuenta Vista · 9876543',
    aliases: ['carlos', 'valdes'],
    initials: 'CV',
    isFavorite: false,
  },
  elena: {
    id: 'elena',
    name: 'Elena Ramírez',
    rut: '12.345.678-9',
    bank: 'BCI',
    account: 'Cuenta Corriente · 12345678',
    aliases: ['elena', 'helena', 'ramirez'],
    initials: 'ER',
    isFavorite: true,
  },
  luis: {
    id: 'luis',
    name: 'Luis Olate',
    rut: '8.123.456-7',
    bank: 'Banco Santander',
    account: 'Cuenta Corriente · 8123456',
    aliases: ['luis', 'olate', 'olathe'],
    initials: 'LO',
    isFavorite: true,
  },
};

export const INITIAL_BALANCE = 100065; // $100.065
export const DEFAULT_ORIGIN_ACCOUNT = 'CuentaRUT 00020920713';
