# Catálogo

## `gri_catalogo.json` (PRIVADO: fica em `privado/`, fora do Git)

O catálogo das Normas GRI **não está neste repositório**: o grupo o recebe por e-mail e o coloca em `privado/gri_catalogo.json` (ver `privado/LEIA-ME.md`). Ele é lido **se existir**; sem ele o app funciona mostrando só os códigos GRI.

Formato (para quem precisar recriá-lo ou importá-lo):

```jsonc
{
  "fonte": "…",
  "conteudos": [ { "id": "305-4:2016", "codigo": "305-4", "titulo": "…", "norma": "…", "norma_numero": 305,
                   "tema": "…", "versao": 2016, "pagina": 721, "pilar_padrao": "A", "pilar_revisado": false } ],
  "refs_setoriais": { "T1|GRI 11": { "norma": "…", "titulo": "…", "pagina": 142 } }   // títulos/páginas das normas setoriais usadas
}
```

`id` = `código:versão` (há dois GRI 306: 2016 e 2020). `pagina` = página **impressa** no PDF consolidado. `pilar_padrao` é sugestão do grupo (o GRI não classifica em A/S/G).

## `indicadores.json`

Registro **público** dos indicadores calculáveis (hoje 21). Cada um liga-se ao catálogo privado por `gri[].id` (só o código, ex.: `305-1:2016`; normas setoriais guardam só `norma: "GRI 11"`). Campos principais: `pilar`, `titulo`, `por_que_asg`, `como_calcula`, `cobertura` (`completa`/`parcial`), `ocupacional`, `medidas[]` (com `expr`, `sentido`, `formato`). Veja `docs/arquitetura.md`.

Nível de maturidade de cada conteúdo GRI (calculado em `nucleo/registro.js`; **só com o catálogo privado carregado**):

1. **catalogado**: só está no catálogo;
2. **mapeado**: tem indicador/fórmula, faltam dados;
3. **calculável**: tem fórmula e dados;
4. **em painel**: calculável e usado pelo tema aberto.
