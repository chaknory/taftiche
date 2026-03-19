<?php

enum JobRank: string
{
    case PrimaryTeacherFirst   = 'أستاذ تعليم إبتدائي قسم أول';
    case PrimaryTeacherSecond  = 'أستاذ تعليم إبتدائي قسم ثاني';
    case PrimaryTeacherSenior  = 'أستاذ تعليم إبتدائي مميز';
    case PrimaryTeacherTrainee = 'أستاذ تعليم إبتدائي متربص';
    case PrimaryTeacherContract= 'أستاذ تعليم إبتدائي متعاقد';

    /** Libellé à afficher (ici identique à la valeur) */
    public function label(): string
    {
        return $this->value;
    }

    /** Liste pratique pour itérer proprement */
    public static function all(): array
    {
        return [
            self::PrimaryTeacherFirst,
            self::PrimaryTeacherSecond,
            self::PrimaryTeacherSenior,
            self::PrimaryTeacherTrainee,
            self::PrimaryTeacherContract,
        ];
    }
}