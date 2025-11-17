# Formato del Archivo CSV/Excel para Estudiantes

## Columnas Requeridas

### Columna Obligatoria:
- **`matricula`** o **`matrícula`**: Número de matrícula del estudiante (puede tener ceros a la izquierda, se normalizarán automáticamente)
  - Ejemplos: `13664`, `0013664`, `00013664`

### Columnas Opcionales:

- **`nombre_abr`** o **`nombre`**: Nombre completo del estudiante
  - Ejemplo: `PÉREZ GARCÍA, JUAN`

- **`cve_nivel`** o **`nivel`**: Clave del nivel académico
  - Ejemplos: `PROF`, `PREP`, `POSG`

- **`cve_programa`** o **`programa`**: Clave del programa académico
  - Ejemplos: `LAE`, `IS`, `PREN`

- **`cve_departamento`** o **`departamento`**: Clave del departamento
  - Ejemplos: `ING`, `ECA`, `ADM`

- **`activo`**: Estado del estudiante (opcional, por defecto será `true`)
  - Valores aceptados: `true`, `false`, `1`, `0`, `Sí`, `No`, `si`, `no`
  - Si no se especifica, el estudiante se creará como activo

## Ejemplo de Archivo CSV

```csv
matricula,nombre_abr,cve_nivel,cve_programa,cve_departamento,activo
13664,PÉREZ GARCÍA, JUAN,PROF,LAE,ING,true
13665,LÓPEZ RODRÍGUEZ, MARÍA,PREP,PREN,ECA,true
13666,GONZÁLEZ MARTÍNEZ, CARLOS,PROF,IS,ING,true
13667,RAMÍREZ SÁNCHEZ, ANA,PREP,PREN,ECA,false
13668,TORRES FLORES, LUIS,PROF,LAE,ECA,true
```

## Ejemplo Mínimo (Solo Matrícula)

```csv
matricula
13664
13665
13666
```

## Notas Importantes

1. **Encabezados**: La primera fila debe contener los nombres de las columnas
2. **Matrícula**: Es el único campo obligatorio. Puede tener ceros a la izquierda (ej: `00013664`), se normalizarán automáticamente
3. **Formato de archivo**: Se aceptan archivos `.csv`, `.xlsx`, o `.xls`
4. **Renovación completa**: Si subes un archivo, los estudiantes que NO estén en el archivo pero SÍ en la base de datos serán **desactivados automáticamente**
5. **Duplicados**: Si hay matrículas duplicadas en el archivo, se mostrará un error
6. **Actualización**: Si una matrícula ya existe en la base de datos, se actualizarán sus datos con los del archivo

## Proceso de Carga

1. **Vista Previa**: Antes de aplicar cambios, verás:
   - Nuevos estudiantes a insertar
   - Estudiantes a actualizar
   - Estudiantes a desactivar (no están en el archivo)
   - Errores encontrados

2. **Aplicar Cambios**: Después de revisar, puedes aplicar los cambios a la base de datos

## Ejemplo de Archivo Excel

Puedes usar Excel con las mismas columnas. Asegúrate de que:
- La primera fila contenga los encabezados
- Las columnas estén en el orden que prefieras (se detectan automáticamente)
- Los nombres de las columnas coincidan con los mencionados arriba (no importa mayúsculas/minúsculas)

