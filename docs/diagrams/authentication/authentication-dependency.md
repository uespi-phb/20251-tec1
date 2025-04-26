# Autenticação com Google

## Dados:
* Token de Acesso

## Fluxo Primário:
1. Obter dados da API do Google (nome, email e Google Id)
2. Consultar se existe um usuário com o email recebido acima
3. Criar uma conta para o usuário com os dados recebidos do Google
4. Criar, a partir do ID, um token de acesso para o usuário com expiração em 30 minutos
5. Retornar o token de acesso gerado

## Fluxo Alternativo: Usuário já existe
3. Atualizar a conta do usuário com os dados recebidos do Google. Só atualizar o nome se a conta do usuário não possuir nome cadastrado

## Fluxo de Exceção: Token Inválido ou Expirado
1. Levantar um erro de autenticação
