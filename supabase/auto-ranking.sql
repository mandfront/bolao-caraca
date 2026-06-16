-- =========================================
-- AUTO-RECALCULO DE PONTUAÇÃO
-- Recalcula pontos dos palpites automaticamente
-- quando uma partida muda para status 'finished'
-- =========================================

CREATE OR REPLACE FUNCTION public.recalculate_predictions_for_match(p_match_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_match public.matches%ROWTYPE;
  v_pred public.predictions%ROWTYPE;
  v_home_score integer;
  v_away_score integer;
  v_pred_home integer;
  v_pred_away integer;
  v_points integer;
  v_exact boolean;
  v_winner boolean;
  v_goal_diff boolean;
  v_team_goals boolean;
  v_pred_winner text;
  v_match_winner text;
  v_count integer := 0;
BEGIN
  -- Busca a partida
  SELECT * INTO v_match FROM public.matches WHERE id = p_match_id;
  IF NOT FOUND OR v_match.status != 'finished' THEN
    RETURN 0;
  END IF;

  v_home_score := v_match.home_score;
  v_away_score := v_match.away_score;

  -- Para cada palpite desta partida
  FOR v_pred IN SELECT * FROM public.predictions WHERE match_id = p_match_id LOOP
    v_pred_home := v_pred.home_score;
    v_pred_away := v_pred.away_score;

    -- Calcula vencedor real
    IF v_home_score > v_away_score THEN v_match_winner := 'home';
    ELSIF v_away_score > v_home_score THEN v_match_winner := 'away';
    ELSE v_match_winner := 'draw';
    END IF;

    -- Calcula vencedor do palpite
    IF v_pred_home > v_pred_away THEN v_pred_winner := 'home';
    ELSIF v_pred_away > v_pred_home THEN v_pred_winner := 'away';
    ELSE v_pred_winner := 'draw';
    END IF;

    -- Placar exato
    v_exact := (v_pred_home = v_home_score AND v_pred_away = v_away_score);

    IF v_exact THEN
      v_points := 5;
      v_exact := true;
      v_winner := true;
      v_goal_diff := true;
      v_team_goals := true;
    ELSE
      v_winner := (v_pred_winner = v_match_winner);
      v_goal_diff := ((v_pred_home - v_pred_away) = (v_home_score - v_away_score));
      v_team_goals := (v_pred_home = v_home_score OR v_pred_away = v_away_score);

      IF v_winner THEN v_points := 3;
      ELSIF v_goal_diff THEN v_points := 2;
      ELSIF v_team_goals THEN v_points := 1;
      ELSE v_points := 0;
      END IF;
    END IF;

    -- Atualiza palpite
    UPDATE public.predictions SET
      points = v_points,
      exact_score = v_exact,
      correct_winner = v_winner,
      correct_goal_difference = v_goal_diff,
      correct_team_goals = v_team_goals,
      updated_at = now()
    WHERE id = v_pred.id;

    -- Log de pontuação
    INSERT INTO public.score_logs (prediction_id, match_id, user_id, group_id, points, reason)
    VALUES (v_pred.id, p_match_id, v_pred.user_id, v_pred.group_id, v_points,
      CASE v_points
        WHEN 5 THEN 'Placar exato'
        WHEN 3 THEN 'Acertou vencedor/empate'
        WHEN 2 THEN 'Acertou saldo de gols'
        WHEN 1 THEN 'Acertou gols de um time'
        ELSE 'Errou tudo'
      END)
    ON CONFLICT DO NOTHING;

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

-- Trigger: recalcula automaticamente quando status muda para 'finished'
CREATE OR REPLACE FUNCTION public.trigger_recalculate_on_finish()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.status = 'finished' AND (OLD.status IS DISTINCT FROM 'finished') THEN
    PERFORM public.recalculate_predictions_for_match(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_match_finished ON public.matches;
CREATE TRIGGER on_match_finished
  AFTER UPDATE ON public.matches
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_recalculate_on_finish();

-- Para partidas já finalizadas (seed), recalcula manualmente:
-- SELECT public.recalculate_predictions_for_match(id) FROM public.matches WHERE status = 'finished';
