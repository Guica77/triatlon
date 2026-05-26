-- Agregar política de DELETE para la tabla user_workouts para que los usuarios puedan reiniciar su plan de entrenamiento
CREATE POLICY "Users can delete own workouts" 
ON public.user_workouts 
FOR DELETE 
USING (auth.uid() = user_id);
